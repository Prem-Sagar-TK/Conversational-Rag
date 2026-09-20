import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "vector_db_status" in data

def test_conversations_api_lifecycle():
    # Create conversation
    create_res = client.post("/api/conversations")
    assert create_res.status_code == 201
    conv_data = create_res.json()
    conv_id = conv_data["conversation_id"]
    assert conv_id is not None
    
    # Get conversation details
    detail_res = client.get(f"/api/conversations/{conv_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["conversation_id"] == conv_id
    assert detail_data["total_turns"] == 0
    
    # List conversations
    list_res = client.get("/api/conversations")
    assert list_res.status_code == 200
    
    # Delete conversation
    del_res = client.delete(f"/api/conversations/{conv_id}")
    assert del_res.status_code == 200

def test_document_ingestion_and_chat_workflow():
    # Upload sample policy
    sample_content = b"# Security Policy\n\nAll passwords must be at least 16 characters in length and include symbols.\nMulti-factor authentication (MFA) is mandatory for all employee accounts."
    
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("security_policy.md", sample_content, "text/markdown")}
    )
    assert upload_res.status_code == 201
    doc_data = upload_res.json()
    doc_id = doc_data["document_id"]
    assert doc_data["filename"] == "security_policy.md"
    assert doc_data["chunk_count"] > 0

    # Ask initial question
    chat_res1 = client.post("/api/chat", json={
        "message": "What is the minimum password length?"
    })
    assert chat_res1.status_code == 200
    chat_data1 = chat_res1.json()
    conv_id = chat_data1["conversation_id"]
    assert "16" in chat_data1["answer"] or len(chat_data1["sources"]) > 0
    assert chat_data1["rewritten_query"] is not None

    # Ask ambiguous follow-up question
    chat_res2 = client.post("/api/chat", json={
        "conversation_id": conv_id,
        "message": "Is MFA required for that?"
    })
    assert chat_res2.status_code == 200
    chat_data2 = chat_res2.json()
    assert chat_data2["conversation_id"] == conv_id
    assert chat_data2["rewritten_query"] is not None

    # Clean up document
    del_res = client.delete(f"/api/documents/{doc_id}")
    assert del_res.status_code == 200
