import React, { useState, useEffect } from 'react';
import { StudioThemeProvider, useStudioTheme } from './context/StudioTheme';
import { StudioNavRail } from './components/StudioNavRail';
import { ConversationSidebar } from './components/ConversationSidebar';
import { DocumentManager } from './components/DocumentManager';
import { ChatInterface } from './components/ChatInterface';
import { api } from './services/api';
import {
  Message,
  DocumentInfo,
  ConversationSummaryItem,
  HealthStatus,
} from './types';
import { AlertCircle } from 'lucide-react';

const StudioMain: React.FC = () => {
  const { navTab, mobilePanel, setMobilePanel } = useStudioTheme();

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [conversations, setConversations] = useState<ConversationSummaryItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [isDocLoading, setIsDocLoading] = useState<boolean>(true);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsDocLoading(true);
      const [healthData, docsData, convsData] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getDocuments().catch(() => ({ documents: [], total_documents: 0, total_chunks: 0 })),
        api.getConversations().catch(() => ({ conversations: [] })),
      ]);

      if (healthData) setHealth(healthData);
      setDocuments(docsData.documents || []);
      setConversations(convsData.conversations || []);
    } catch (err: any) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsDocLoading(false);
    }
  };

  const handleSendMessage = async (text: string, topK?: number) => {
    setGlobalError(null);
    const userMsg: Message = {
      role: 'user',
      content: text,
      original_query: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const response = await api.sendMessage(text, activeConversationId || undefined, topK);

      const assistantMsg: Message = {
        role: 'assistant',
        content: response.answer,
        original_query: response.original_query,
        rewritten_query: response.rewritten_query,
        sources: response.sources,
        summary_state: response.summary_state,
        recent_message_count: response.recent_message_count,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setActiveConversationId(response.conversation_id);

      const convsData = await api.getConversations();
      setConversations(convsData.conversations || []);
    } catch (err: any) {
      console.error('Chat error:', err);
      setGlobalError(err.message || 'Failed to generate response.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleUploadDocument = async (file: File) => {
    await api.uploadDocument(file);
    const docsData = await api.getDocuments();
    setDocuments(docsData.documents || []);
    const healthData = await api.getHealth().catch(() => null);
    if (healthData) setHealth(healthData);
  };

  const handleDeleteDocument = async (docId: string) => {
    await api.deleteDocument(docId);
    const docsData = await api.getDocuments();
    setDocuments(docsData.documents || []);
    const healthData = await api.getHealth().catch(() => null);
    if (healthData) setHealth(healthData);
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setGlobalError(null);
    setMobilePanel('chat');
  };

  const handleSelectConversation = async (conversationId: string) => {
    try {
      setIsChatLoading(true);
      setActiveConversationId(conversationId);
      setMobilePanel('chat');
      const detail = await api.getConversation(conversationId);
      setMessages(detail.recent_messages || []);
    } catch (err: any) {
      console.error('Failed to load conversation:', err);
      setGlobalError('Failed to load selected conversation.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await api.deleteConversation(conversationId);
      if (activeConversationId === conversationId) {
        handleNewChat();
      }
      const convsData = await api.getConversations();
      setConversations(convsData.conversations || []);
    } catch (err: any) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const activeConv = conversations.find((c) => c.conversation_id === activeConversationId);
  const conversationTitle = activeConv ? activeConv.title : 'New RAG Conversation';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased select-none font-sans">
      {/* Modern Navigation Rail */}
      <StudioNavRail
        documentCount={documents.length}
        conversationCount={conversations.length}
        health={health}
      />

      {/* Global Error Banner */}
      {globalError && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-rose-900/90 text-white text-xs px-4 py-2 rounded-xl shadow-xl flex items-center space-x-2 backdrop-blur-md border border-rose-700">
          <AlertCircle className="w-4 h-4 text-rose-300" />
          <span>{globalError}</span>
          <button onClick={() => setGlobalError(null)} className="ml-2 font-bold hover:text-rose-200">
            ✕
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex min-w-0 h-full overflow-hidden">
        {/* Sidebar Panel (Chats or Documents) */}
        <div
          className={`${
            mobilePanel === 'list' ? 'flex' : 'hidden'
          } md:flex flex-col h-full flex-shrink-0 w-full md:w-80 lg:w-[340px] xl:w-[380px] border-r border-slate-200/80 dark:border-slate-800`}
        >
          {navTab === 'chats' ? (
            <ConversationSidebar
              conversations={conversations}
              activeId={activeConversationId}
              onSelect={handleSelectConversation}
              onNewChat={handleNewChat}
              onDelete={handleDeleteConversation}
            />
          ) : (
            <DocumentManager
              documents={documents}
              isLoading={isDocLoading}
              onUpload={handleUploadDocument}
              onDelete={handleDeleteDocument}
            />
          )}
        </div>

        {/* Chat / Detail View */}
        <main
          className={`${
            mobilePanel === 'chat' ? 'flex' : 'hidden'
          } md:flex flex-1 flex-col min-w-0 h-full overflow-hidden`}
        >
          <ChatInterface
            messages={messages}
            isLoading={isChatLoading}
            onSendMessage={handleSendMessage}
            documentCount={documents.length}
            conversationTitle={conversationTitle}
            health={health}
          />
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <StudioThemeProvider>
      <StudioMain />
    </StudioThemeProvider>
  );
};

export default App;
