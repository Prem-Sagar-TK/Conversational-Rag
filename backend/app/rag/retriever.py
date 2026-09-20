import logging
from typing import List, Dict, Any, Optional
from app.config import settings
from app.vectorstore.chroma import get_vector_store
from app.models.schemas import Citation

logger = logging.getLogger(__name__)

class VectorRetriever:
    """Retriever abstraction layer for vector similarity search over document chunks."""

    def __init__(self, top_k: Optional[int] = None, similarity_threshold: Optional[float] = None):
        self.top_k = top_k or settings.TOP_K
        self.similarity_threshold = similarity_threshold or settings.SIMILARITY_THRESHOLD
        self.vector_store = get_vector_store()

    def retrieve(
        self,
        query: str,
        top_k: Optional[int] = None,
        where_filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant chunks for a standalone query."""
        k = top_k or self.top_k
        logger.info(f"Retrieving top_{k} chunks for query: '{query}'")

        try:
            chunks = self.vector_store.similarity_search(
                query=query,
                top_k=k,
                where=where_filter
            )
            # Filter by similarity threshold if positive
            if self.similarity_threshold > 0:
                chunks = [c for c in chunks if c.get("score", 0.0) >= self.similarity_threshold]

            logger.info(f"Retrieved {len(chunks)} chunks matching query.")
            return chunks
        except Exception as e:
            logger.error(f"Error during vector retrieval: {str(e)}", exc_info=True)
            return []

    def format_citations(self, chunks: List[Dict[str, Any]]) -> List[Citation]:
        """Convert retrieved chunks into structured Citations."""
        citations: List[Citation] = []
        for chunk in chunks:
            meta = chunk.get("metadata", {})
            citations.append(Citation(
                document=meta.get("filename", "Unknown document"),
                page=meta.get("page"),
                chunk_id=chunk.get("chunk_id", meta.get("chunk_id", "")),
                snippet=chunk.get("content", "")[:300] + ("..." if len(chunk.get("content", "")) > 300 else ""),
                score=chunk.get("score")
            ))
        return citations

    def format_context_for_llm(self, chunks: List[Dict[str, Any]]) -> str:
        """Format retrieved chunks into clean text context with source identifiers for LLM prompt."""
        if not chunks:
            return "No relevant documents found in the database."

        formatted_blocks = []
        for i, chunk in enumerate(chunks, start=1):
            meta = chunk.get("metadata", {})
            doc_name = meta.get("filename", "Document")
            page = meta.get("page")
            page_info = f", Page {page}" if page is not None else ""
            content = chunk.get("content", "").strip()

            block = f"[Source {i}: {doc_name}{page_info}]\n{content}"
            formatted_blocks.append(block)

        return "\n\n".join(formatted_blocks)


_retriever: Optional[VectorRetriever] = None

def get_retriever() -> VectorRetriever:
    global _retriever
    if _retriever is None:
        _retriever = VectorRetriever()
    return _retriever
