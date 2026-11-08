'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWebRTC } from '../context/webrtc.context';
import { UploadCloud, File as FileIcon, CheckCircle2, Download, X } from 'lucide-react';

interface ReceivedFile {
  fileId: string;
  name: string;
  size: number;
  type: string;
  blobUrl: string;
  timestamp: string;
}

export const FileShare: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { manager } = useWebRTC();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const fileChunksBuffer = useRef<Map<string, { chunks: ArrayBuffer[]; receivedCount: number; meta: any }>>(
    new Map()
  );

  useEffect(() => {
    const unsub = manager.onFileChunk((chunk) => {
      let buffer = fileChunksBuffer.current.get(chunk.fileId);
      if (!buffer) {
        buffer = {
          chunks: new Array(chunk.totalChunks),
          receivedCount: 0,
          meta: chunk,
        };
        fileChunksBuffer.current.set(chunk.fileId, buffer);
      }

      buffer.chunks[chunk.chunkIndex] = chunk.data;
      buffer.receivedCount++;

      // When all chunks arrive, assemble Blob
      if (buffer.receivedCount === chunk.totalChunks) {
        const blob = new Blob(buffer.chunks, { type: chunk.type || 'application/octet-stream' });
        const blobUrl = URL.createObjectURL(blob);

        setReceivedFiles((prev) => [
          {
            fileId: chunk.fileId,
            name: chunk.name,
            size: chunk.size,
            type: chunk.type,
            blobUrl,
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);

        fileChunksBuffer.current.delete(chunk.fileId);
      }
    });

    return () => unsub();
  }, [manager]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActiveFileName(file.name);
    setUploadProgress(0);

    try {
      await manager.sendFile(file, (pct) => {
        setUploadProgress(pct);
      });
    } catch (err) {
      console.error('File transfer failed:', err);
    } finally {
      setTimeout(() => {
        setUploadProgress(null);
        setActiveFileName(null);
      }, 1500);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-4 top-20 bottom-24 w-88 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md z-30 flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <FileIcon className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-sm text-white">Direct Peer File Transfer</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Upload Zone */}
      <div className="mt-4">
        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-blue-500/80 rounded-xl cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition group">
          <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-blue-400 transition mb-2" />
          <span className="text-xs font-medium text-slate-200">Send File via DataChannel</span>
          <span className="text-[11px] text-slate-400 mt-0.5">Chunked 64KB with SCTP Backpressure</span>
          <input type="file" onChange={handleFileUpload} className="hidden" />
        </label>

        {/* Transfer Progress */}
        {uploadProgress !== null && (
          <div className="mt-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="flex justify-between text-xs text-slate-300 mb-1.5 truncate">
              <span className="truncate">{activeFileName}</span>
              <span className="font-mono text-blue-400">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-150"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Received Files List */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
          Received Files ({receivedFiles.length})
        </div>

        {receivedFiles.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No files received yet.
          </div>
        ) : (
          receivedFiles.map((f) => (
            <div
              key={f.fileId}
              className="flex items-center justify-between p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl hover:bg-slate-800 transition"
            >
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-medium text-white truncate">{f.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {formatBytes(f.size)} • {f.timestamp}
                  </p>
                </div>
              </div>
              <a
                href={f.blobUrl}
                download={f.name}
                className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shrink-0 ml-2"
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

