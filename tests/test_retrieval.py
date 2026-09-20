import pytest
import uuid
from app.vectorstore.chroma import ChromaVectorStore
from app.rag.retriever import VectorRetriever

def test_chroma_vector_store_operations(tmp_path):
    # Use isolated test directory
    db_path = str(tmp_path / "test_chroma")
    vstore = ChromaVectorStore(persist_directory=db_path, collection_name="test_col")
    
    doc_id = str(uuid.uuid4())
    ids = [f"{doc_id}_chunk_0", f"{doc_id}_chunk_1"]
    documents = [
        "Annual leave entitlement is 20 days per year for all full-time employees.",
        "Employees can carry forward up to 5 days of unused leave into Q1."
    ]
    metadatas = [
        {"document_id": doc_id, "filename": "leave.md", "page": 1, "chunk_index": 0},
        {"document_id": doc_id, "filename": "leave.md", "page": 1, "chunk_index": 1}
    ]
    
    vstore.add_documents(ids, documents, metadatas)
    assert vstore.get_total_chunks() == 2
    
    # Query
    results = vstore.similarity_search("How many days of annual leave?", top_k=2)
    assert len(results) > 0
    assert "Annual leave" in results[0]["content"] or "Annual leave" in results[1]["content"]
    assert results[0]["metadata"]["filename"] == "leave.md"
    
    # Delete
    deleted_count = vstore.delete_document(doc_id)
    assert deleted_count == 2
    assert vstore.get_total_chunks() == 0

def test_retriever_citation_formatting():
    retriever = VectorRetriever()
    mock_chunks = [
        {
            "chunk_id": "doc123_chunk_0",
            "content": "Employees get 20 days paid leave.",
            "metadata": {"filename": "policy.pdf", "page": 3, "chunk_id": "doc123_chunk_0"},
            "score": 0.92
        }
    ]
    citations = retriever.format_citations(mock_chunks)
    assert len(citations) == 1
    assert citations[0].document == "policy.pdf"
    assert citations[0].page == 3
    assert citations[0].score == 0.92
    assert "20 days" in citations[0].snippet
