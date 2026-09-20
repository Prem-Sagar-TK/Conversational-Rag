import os
import hashlib
import logging
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from chromadb.utils import embedding_functions
from app.config import settings

logger = logging.getLogger(__name__)

class FastFallbackEmbeddingFunction(embedding_functions.EmbeddingFunction):
    """Fast, deterministic hash-based embedding function for local development and tests without OpenAI key."""
    def __init__(self):
        pass

    @staticmethod
    def name() -> str:
        return "default"

    def __call__(self, input: chromadb.Documents) -> chromadb.Embeddings:
        embeddings = []
        dim = 128
        for doc in input:
            vec = [0.0] * dim
            tokens = doc.lower().split()
            if not tokens:
                embeddings.append(vec)
                continue
            for token in tokens:
                h = int(hashlib.md5(token.encode('utf-8')).hexdigest(), 16) % dim
                vec[h] += 1.0
            norm = sum(x * x for x in vec) ** 0.5
            if norm > 0:
                vec = [x / norm for x in vec]
            embeddings.append(vec)
        return embeddings


class ChromaVectorStore:
    """Vector database manager using persistent ChromaDB with clean abstraction."""

    def __init__(self, persist_directory: Optional[str] = None, collection_name: Optional[str] = None):
        self.persist_directory = persist_directory or settings.CHROMA_PERSIST_DIRECTORY
        self.collection_name = collection_name or settings.COLLECTION_NAME
        
        # Ensure persist directory exists
        os.makedirs(self.persist_directory, exist_ok=True)
        
        # Initialize Chroma persistent client
        self.client = chromadb.PersistentClient(
            path=self.persist_directory,
            settings=ChromaSettings(anonymized_telemetry=False, is_persistent=True)
        )
        
        self.embedding_fn = self._get_embedding_function()
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"}
        )
        logger.info(f"Initialized ChromaDB collection '{self.collection_name}' at {self.persist_directory}")

    def _get_embedding_function(self):
        """Get embedding function, preferring OpenAIEmbeddings with fallback."""
        api_key = settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY")
        if api_key and not api_key.startswith("your_openai_api_key"):
            try:
                return embedding_functions.OpenAIEmbeddingFunction(
                    api_key=api_key,
                    model_name=settings.EMBEDDING_MODEL
                )
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAIEmbeddingFunction ({e}), falling back.")
        
        return FastFallbackEmbeddingFunction()

    def add_documents(
        self,
        ids: List[str],
        documents: List[str],
        metadatas: List[Dict[str, Any]]
    ) -> None:
        """Add text chunks with their IDs and metadata to ChromaDB."""
        if not ids or not documents:
            return
        
        # ChromaDB requires all metadata values to be str, int, float, or bool
        cleaned_metadatas = []
        for meta in metadatas:
            cleaned = {}
            for k, v in meta.items():
                if v is None:
                    continue
                if isinstance(v, (str, int, float, bool)):
                    cleaned[k] = v
                else:
                    cleaned[k] = str(v)
            cleaned_metadatas.append(cleaned)

        self.collection.add(
            ids=ids,
            documents=documents,
            metadatas=cleaned_metadatas
        )
        logger.info(f"Added {len(documents)} chunks to collection '{self.collection_name}'")

    def similarity_search(
        self,
        query: str,
        top_k: int = 4,
        where: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Perform similarity search over document chunks."""
        count = self.collection.count()
        if count == 0:
            return []

        actual_k = min(top_k, count)
        results = self.collection.query(
            query_texts=[query],
            n_results=actual_k,
            where=where,
            include=["documents", "metadatas", "distances"]
        )

        chunks = []
        if results and results.get("ids") and len(results["ids"]) > 0:
            ids = results["ids"][0]
            docs = results["documents"][0] if results.get("documents") else []
            metas = results["metadatas"][0] if results.get("metadatas") else []
            distances = results["distances"][0] if results.get("distances") else []

            for i in range(len(ids)):
                # Convert cosine distance to cosine similarity: sim = 1 - dist
                dist = distances[i] if i < len(distances) else 0.0
                score = round(max(0.0, 1.0 - dist), 4)
                
                chunks.append({
                    "chunk_id": ids[i],
                    "content": docs[i] if i < len(docs) else "",
                    "metadata": metas[i] if i < len(metas) else {},
                    "score": score
                })
        return chunks

    def delete_document(self, document_id: str) -> int:
        """Delete all vector chunks associated with a specific document_id."""
        existing = self.collection.get(where={"document_id": document_id})
        ids_to_delete = existing.get("ids", [])
        if ids_to_delete:
            self.collection.delete(ids=ids_to_delete)
            logger.info(f"Deleted {len(ids_to_delete)} chunks for document '{document_id}'")
            return len(ids_to_delete)
        return 0

    def list_indexed_documents(self) -> List[Dict[str, Any]]:
        """List distinct documents indexed in the vector store with chunk counts."""
        count = self.collection.count()
        if count == 0:
            return []

        all_items = self.collection.get(include=["metadatas"])
        metas = all_items.get("metadatas", [])
        
        doc_stats: Dict[str, Dict[str, Any]] = {}
        for meta in metas:
            doc_id = meta.get("document_id")
            if not doc_id:
                continue
            if doc_id not in doc_stats:
                doc_stats[doc_id] = {
                    "document_id": doc_id,
                    "filename": meta.get("filename", "unknown"),
                    "file_type": meta.get("file_type", "unknown"),
                    "chunk_count": 0,
                    "created_at": meta.get("created_at", "")
                }
            doc_stats[doc_id]["chunk_count"] += 1

        return list(doc_stats.values())

    def get_total_chunks(self) -> int:
        """Return total number of vector chunks stored."""
        return self.collection.count()


# Singleton vector store instance
_vector_store: Optional[ChromaVectorStore] = None

def get_vector_store() -> ChromaVectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = ChromaVectorStore()
    return _vector_store
