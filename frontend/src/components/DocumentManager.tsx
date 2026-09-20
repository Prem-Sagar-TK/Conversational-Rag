import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCode,
  File,
  HardDrive,
} from 'lucide-react';
import { DocumentInfo } from '../types';
import { useStudioTheme } from '../context/StudioTheme';

interface DocumentManagerProps {
  documents: DocumentInfo[];
  isLoading: boolean;
  onUpload: (file: File) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  isLoading,
  onUpload,
  onDelete,
}) => {
  const { currentAccent } = useStudioTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);
    setUploading(true);

    try {
      await onUpload(file);
      setUploadSuccess(`Indexed "${file.name}" successfully`);
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, filename: string) => {
    if (!window.confirm(`Remove "${filename}" and its vector chunks?`)) {
      return;
    }
    setDeletingId(docId);
    try {
      await onDelete(docId);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return <File className="w-4 h-4 text-rose-500" />;
    if (type.includes('doc')) return <FileText className="w-4 h-4 text-blue-500" />;
    if (type.includes('md') || type.includes('markdown')) return <FileCode className="w-4 h-4 text-emerald-500" />;
    return <FileText className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="w-full md:w-80 lg:w-[340px] xl:w-[380px] h-full flex flex-col flex-shrink-0 border-r bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Documents</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${currentAccent.bgSubtle} ${currentAccent.text}`}>
              {documents.length}
            </span>
          </div>
          <HardDrive className={`w-4 h-4 ${currentAccent.text}`} />
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
            isDragging
              ? `${currentAccent.border} ${currentAccent.bgSubtle}`
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-850'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".pdf,.txt,.docx,.md,.markdown"
            className="hidden"
          />
          <div className="flex flex-col items-center space-y-2">
            <div className={`p-2.5 rounded-xl ${currentAccent.bgSubtle} ${currentAccent.text}`}>
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
            </div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
              {uploading ? 'Indexing into ChromaDB...' : 'Drop a file or click to upload'}
            </p>
            <p className="text-[10px] text-slate-400">PDF, DOCX, TXT, Markdown</p>
          </div>
        </div>
      </div>

      {uploadSuccess && (
        <div className="mx-4 mb-2 flex items-center space-x-2 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 p-2 rounded-xl">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="mx-4 mb-2 flex items-center space-x-2 text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 p-2 rounded-xl">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{uploadError}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
        {isLoading && documents.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-10 px-4">
            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No documents indexed yet</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.document_id}
              className="group flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all"
            >
              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  {getFileIcon(doc.file_type)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate" title={doc.filename}>
                    {doc.filename}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {doc.chunk_count} chunks · {doc.file_type.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(doc.document_id, doc.filename)}
                disabled={deletingId === doc.document_id}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                title="Delete document"
              >
                {deletingId === doc.document_id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
