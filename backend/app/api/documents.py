import logging
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.models.schemas import DocumentUploadResponse, DocumentListResponse, DocumentInfo
from app.rag.ingestion import get_ingestion_service
from app.vectorstore.chroma import get_vector_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(file: UploadFile = File(...)):
    """Upload and ingest a PDF, DOCX, TXT, or Markdown document into the RAG vector store."""
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No filename provided.")

    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

        ingestion_service = get_ingestion_service()
        result = ingestion_service.process_and_ingest(
            filename=file.filename,
            file_bytes=file_bytes
        )
        return DocumentUploadResponse(**result)
    except ValueError as e:
        logger.warning(f"Validation error during ingestion: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error ingesting '{file.filename}': {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and index document: {str(e)}"
        )

@router.get("", response_model=DocumentListResponse)
async def list_documents():
    """List all indexed documents and their chunk counts."""
    try:
        vector_store = get_vector_store()
        docs = vector_store.list_indexed_documents()
        total_chunks = vector_store.get_total_chunks()
        
        doc_infos = [
            DocumentInfo(
                document_id=d["document_id"],
                filename=d["filename"],
                file_type=d["file_type"],
                chunk_count=d["chunk_count"],
                created_at=d["created_at"]
            )
            for d in docs
        ]
        
        return DocumentListResponse(
            documents=doc_infos,
            total_documents=len(doc_infos),
            total_chunks=total_chunks
        )
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list documents.")

@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
async def delete_document(document_id: str):
    """Delete a document and all of its indexed vector chunks."""
    try:
        vector_store = get_vector_store()
        deleted_count = vector_store.delete_document(document_id)
        if deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID '{document_id}' not found."
            )
        return {
            "status": "success",
            "message": f"Successfully deleted document '{document_id}' and {deleted_count} chunks."
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document '{document_id}': {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}"
        )
