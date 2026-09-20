export interface Citation {
  document: string;
  page?: number | null;
  chunk_id: string;
  snippet?: string | null;
  score?: number | null;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  original_query?: string;
  rewritten_query?: string;
  sources?: Citation[];
  summary_state?: string | null;
  recent_message_count?: number;
}

export interface ChatResponse {
  answer: string;
  original_query: string;
  rewritten_query: string;
  sources: Citation[];
  conversation_id: string;
  summary_state?: string | null;
  recent_message_count: number;
}

export interface DocumentInfo {
  document_id: string;
  filename: string;
  file_type: string;
  chunk_count: number;
  created_at: string;
}

export interface DocumentListResponse {
  documents: DocumentInfo[];
  total_documents: number;
  total_chunks: number;
}

export interface DocumentUploadResponse {
  document_id: string;
  filename: string;
  chunk_count: number;
  total_characters: number;
  status: string;
  message: string;
}

export interface ConversationSummaryItem {
  conversation_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationDetail {
  conversation_id: string;
  created_at: string;
  updated_at: string;
  summary?: string | null;
  recent_messages: Message[];
  total_turns: number;
}

export interface HealthStatus {
  status: string;
  vector_db_status: string;
  document_count: number;
  total_chunk_count: number;
  openai_configured: boolean;
}
