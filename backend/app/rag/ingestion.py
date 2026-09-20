import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import io
import logging

from pypdf import PdfReader
import docx
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import settings
from app.vectorstore.chroma import get_vector_store

logger = logging.getLogger(__name__)

class DocumentIngestionService:
    """Service to parse, clean, chunk, and ingest documents into ChromaDB."""

    SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".docx", ".md", ".markdown"}

    def __init__(self, chunk_size: Optional[int] = None, chunk_overlap: Optional[int] = None):
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
            keep_separator=True
        )

    def clean_text(self, text: str) -> str:
        """Clean extracted raw text by removing null bytes, excessive spaces while preserving structure."""
        if not text:
            return ""
        # Remove null bytes
        text = text.replace("\x00", "")
        # Normalize multiple carriage returns and tabs
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        # Replace 3 or more consecutive newlines with 2
        text = re.sub(r"\n{3,}", "\n\n", text)
        # Replace multiple horizontal whitespaces with a single space
        text = re.sub(r"[ \t]+", " ", text)
        return text.strip()

    def parse_pdf(self, file_bytes: bytes) -> List[Tuple[str, int]]:
        """Extract text from PDF page by page. Returns List of (page_text, page_number)."""
        pages_content: List[Tuple[str, int]] = []
        pdf_stream = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_stream)
        for page_num, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            cleaned = self.clean_text(text)
            if cleaned:
                pages_content.append((cleaned, page_num))
        return pages_content

    def parse_docx(self, file_bytes: bytes) -> List[Tuple[str, int]]:
        """Extract text from DOCX file."""
        doc_stream = io.BytesIO(file_bytes)
        doc = docx.Document(doc_stream)
        full_text = []
        for p in doc.paragraphs:
            if p.text.strip():
                full_text.append(p.text)
        # Also extract table contents
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    full_text.append(row_text)
        
        combined_text = self.clean_text("\n\n".join(full_text))
        return [(combined_text, 1)] if combined_text else []

    def parse_text_or_markdown(self, file_bytes: bytes) -> List[Tuple[str, int]]:
        """Extract text from TXT or Markdown files."""
        text = ""
        for encoding in ["utf-8", "utf-16", "latin-1", "cp1252"]:
            try:
                text = file_bytes.decode(encoding)
                break
            except (UnicodeDecodeError, LookupError):
                continue
        cleaned = self.clean_text(text)
        return [(cleaned, 1)] if cleaned else []

    def extract_document_pages(self, filename: str, file_bytes: bytes) -> List[Tuple[str, int]]:
        """Dispatch document parsing based on file extension."""
        ext = Path(filename).suffix.lower()
        if ext not in self.SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file type '{ext}'. Supported types: {', '.join(self.SUPPORTED_EXTENSIONS)}")

        if ext == ".pdf":
            return self.parse_pdf(file_bytes)
        elif ext == ".docx":
            return self.parse_docx(file_bytes)
        elif ext in {".txt", ".md", ".markdown"}:
            return self.parse_text_or_markdown(file_bytes)
        else:
            raise ValueError(f"No parser available for {ext}")

    def process_and_ingest(
        self,
        filename: str,
        file_bytes: bytes,
        document_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Ingest a document: parse, chunk with metadata, and insert into ChromaDB."""
        if not file_bytes:
            raise ValueError("Uploaded file is empty.")

        doc_id = document_id or str(uuid.uuid4())
        ext = Path(filename).suffix.lower()
        created_at = datetime.now(timezone.utc).isoformat()

        # Extract text per page
        pages = self.extract_document_pages(filename, file_bytes)
        if not pages:
            raise ValueError(f"No extractable text found in '{filename}'.")

        # Create chunks with metadata
        all_chunks_text: List[str] = []
        all_chunk_ids: List[str] = []
        all_chunk_metas: List[Dict[str, Any]] = []

        total_characters = 0
        chunk_counter = 0

        for page_text, page_num in pages:
            total_characters += len(page_text)
            page_splits = self.text_splitter.split_text(page_text)
            
            for split_text in page_splits:
                if not split_text.strip():
                    continue
                
                chunk_id = f"{doc_id}_chunk_{chunk_counter}"
                metadata = {
                    "document_id": doc_id,
                    "filename": filename,
                    "file_type": ext.lstrip("."),
                    "page": page_num,
                    "chunk_id": chunk_id,
                    "chunk_index": chunk_counter,
                    "created_at": created_at
                }
                
                all_chunks_text.append(split_text)
                all_chunk_ids.append(chunk_id)
                all_chunk_metas.append(metadata)
                chunk_counter += 1

        if not all_chunks_text:
            raise ValueError(f"Could not generate any chunks from '{filename}'.")

        # Update total_chunks in metadata
        for meta in all_chunk_metas:
            meta["total_chunks"] = chunk_counter

        # Insert into ChromaDB
        vector_store = get_vector_store()
        vector_store.add_documents(
            ids=all_chunk_ids,
            documents=all_chunks_text,
            metadatas=all_chunk_metas
        )

        logger.info(f"Ingested '{filename}' ({doc_id}) with {chunk_counter} chunks.")

        return {
            "document_id": doc_id,
            "filename": filename,
            "chunk_count": chunk_counter,
            "total_characters": total_characters,
            "status": "success",
            "message": f"Successfully ingested {filename} with {chunk_counter} chunks."
        }


# Singleton instance
_ingestion_service: Optional[DocumentIngestionService] = None

def get_ingestion_service() -> DocumentIngestionService:
    global _ingestion_service
    if _ingestion_service is None:
        _ingestion_service = DocumentIngestionService()
    return _ingestion_service
