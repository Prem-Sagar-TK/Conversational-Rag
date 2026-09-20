import {
  ChatResponse,
  DocumentListResponse,
  DocumentUploadResponse,
  ConversationSummaryItem,
  ConversationDetail,
  HealthStatus
} from '../types';

const API_BASE = '/api';

export const api = {
  async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async getDocuments(): Promise<DocumentListResponse> {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async uploadDocument(file: File): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(errorData.detail || 'Failed to upload document');
    }

    return res.json();
  },

  async deleteDocument(documentId: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/documents/${documentId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Deletion failed' }));
      throw new Error(errorData.detail || 'Failed to delete document');
    }

    return res.json();
  },

  async getConversations(): Promise<{ conversations: ConversationSummaryItem[] }> {
    const res = await fetch(`${API_BASE}/conversations`);
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  async createConversation(): Promise<{ conversation_id: string; created_at: string }> {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  },

  async getConversation(conversationId: string): Promise<ConversationDetail> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}`);
    if (!res.ok) throw new Error('Failed to fetch conversation details');
    return res.json();
  },

  async deleteConversation(conversationId: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
    return res.json();
  },

  async sendMessage(
    message: string,
    conversationId?: string,
    topK?: number
  ): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId || null,
        top_k: topK || null,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Chat request failed' }));
      throw new Error(errorData.detail || 'Failed to process message');
    }

    return res.json();
  },
};
