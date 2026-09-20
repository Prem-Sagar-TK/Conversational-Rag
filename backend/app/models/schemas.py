from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

class Citation(BaseModel):
    document: str = Field(..., description="Source filename")
    page: Optional[int] = Field(None, description="Page number where available (1-indexed)")
    chunk_id: str = Field(..., description="Unique chunk identifier")
    snippet: Optional[str] = Field(None, description="Snippet of retrieved content")
    score: Optional[float] = Field(None, description="Similarity or relevance score")

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = Field(None, description="Existing conversation ID or None to start fresh")
    message: str = Field(..., min_length=1, description="User's query or message")
    top_k: Optional[int] = Field(None, description="Custom number of chunks to retrieve")

class ChatResponse(BaseModel):
    answer: str = Field(..., description="Generated answer based on retrieved documents")
    original_query: str = Field(..., description="Original question asked by user")
    rewritten_query: str = Field(..., description="Contextually rewritten standalone query used for retrieval")
    sources: List[Citation] = Field(default_factory=list, description="Source citations for the answer")
    conversation_id: str = Field(..., description="Conversation ID")
    summary_state: Optional[str] = Field(None, description="Current bounded conversation summary if present")
    recent_message_count: int = Field(0, description="Number of recent messages in the sliding memory window")

class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    chunk_count: int
    total_characters: int
    status: str
    message: str

class DocumentInfo(BaseModel):
    document_id: str
    filename: str
    file_type: str
    chunk_count: int
    created_at: str

class DocumentListResponse(BaseModel):
    documents: List[DocumentInfo]
    total_documents: int
    total_chunks: int

class Message(BaseModel):
    role: str = Field(..., description="user or assistant")
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    original_query: Optional[str] = None
    rewritten_query: Optional[str] = None
    sources: Optional[List[Citation]] = None

class ConversationCreateResponse(BaseModel):
    conversation_id: str
    created_at: str

class ConversationDetailResponse(BaseModel):
    conversation_id: str
    created_at: str
    updated_at: str
    summary: Optional[str] = None
    recent_messages: List[Message] = Field(default_factory=list)
    total_turns: int

class ConversationSummaryItem(BaseModel):
    conversation_id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int

class ConversationListResponse(BaseModel):
    conversations: List[ConversationSummaryItem]

class HealthResponse(BaseModel):
    status: str
    vector_db_status: str
    document_count: int
    total_chunk_count: int
    openai_configured: bool
