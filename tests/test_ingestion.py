import pytest
from app.rag.ingestion import DocumentIngestionService

def test_clean_text():
    service = DocumentIngestionService()
    raw = "Hello\x00 world! \r\n\r\n\r\n\r\nTest   multiple    spaces.\r\n"
    cleaned = service.clean_text(raw)
    assert "\x00" not in cleaned
    assert "\r" not in cleaned
    assert "Test multiple spaces." in cleaned

def test_parse_markdown_and_chunking():
    service = DocumentIngestionService(chunk_size=200, chunk_overlap=30)
    sample_md = b"# Title\n\nSection 1.\nThis is a sample document for testing chunking and metadata preservation.\n\nSection 2.\nAnother paragraph to make sure we produce multiple chunks properly."
    
    result = service.process_and_ingest(
        filename="test_policy.md",
        file_bytes=sample_md
    )
    
    assert result["status"] == "success"
    assert result["chunk_count"] > 0
    assert result["filename"] == "test_policy.md"
    assert "document_id" in result

def test_unsupported_file_extension():
    service = DocumentIngestionService()
    with pytest.raises(ValueError, match="Unsupported file type"):
        service.process_and_ingest(
            filename="invalid.exe",
            file_bytes=b"some binary data"
        )

def test_empty_file_rejection():
    service = DocumentIngestionService()
    with pytest.raises(ValueError, match="empty"):
        service.process_and_ingest(
            filename="empty.txt",
            file_bytes=b""
        )
