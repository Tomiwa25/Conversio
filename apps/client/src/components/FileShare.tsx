'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWebRTC } from '../context/webrtc.context';
import { CryptoUtils } from '../utils/crypto.utils';
import { UploadCloud, File as FileIcon, CheckCircle2, Download, X, Lock, Key } from 'lucide-react';

interface ReceivedFile {
  fileId: string;
  name: string;
  size: number;
  type: string;
  blobUrl: string;
  timestamp: string;
  isEncrypted?: boolean;
}

export const FileShare: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { manager, state } = useWebRTC();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const [passphrase, setPassphrase] = useState<string>('');
  const [isKeyConfigured, setIsKeyConfigured] = useState<boolean>(false);

  const fileChunksBuffer = useRef<Map<string, { chunks: ArrayBuffer[]; receivedCount: number; meta: any }>>(
    new Map()
  );

  // Initialize or derive encryption key from passphrase
  const handleApplyPassphrase = async () => {
    if (!passphrase.trim() || !state.roomId) return;
    try {
      const key = await CryptoUtils.deriveKeyFromPassphrase(passphrase.trim(), state.roomId);
      manager.setEncryptionKey(key);
      setIsKeyConfigured(true);
    } catch (err) {
      console.error('Failed to derive encryption key:', err);
    }
  };

  useEffect(() => {
    const unsub = manager.onFileChunk(async (chunk) => {
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

      // When all chunks arrive, assemble and decrypt
      if (buffer.receivedCount === chunk.totalChunks) {
        // Concatenate all chunks
        const totalLength = buffer.chunks.reduce((acc, c) => acc + c.byteLength, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const c of buffer.chunks) {
          combined.set(new Uint8Array(c), offset);
          offset += c.byteLength;
        }

        let finalBuffer: ArrayBuffer = combined.buffer;

        // Decrypt if file was transmitted with AES-256-GCM
        if (chunk.isEncrypted && chunk.iv && state.encryptionKey) {
          try {
            const ivBytes = Uint8Array.from(atob(chunk.iv), (c) => c.charCodeAt(0));
            finalBuffer = await CryptoUtils.decryptBuffer(state.encryptionKey, ivBytes, combined.buffer);
          } catch (decryptErr) {
            console.error('AES-256-GCM Decryption failed (Authentication Tag mismatch):', decryptErr);
            alert(`Decryption failed for ${chunk.name}. Verify your encryption passphrase.`);
            fileChunksBuffer.current.delete(chunk.fileId);
            return;
          }
        }

        const blob = new Blob([finalBuffer], { type: chunk.type || 'application/octet-stream' });
        const blobUrl = URL.createObjectURL(blob);

        setReceivedFiles((prev) => [
          {
            fileId: chunk.fileId,
            name: chunk.name,
            size: chunk.size,
            type: chunk.type,
            blobUrl,
            timestamp: new Date().toLocaleTimeString(),
            isEncrypted: chunk.isEncrypted,
          },
          ...prev,
        ]);

        fileChunksBuffer.current.delete(chunk.fileId);
      }
    });

    return () => unsub();
  }, [manager, state.encryptionKey]);

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
    <div className="absolute right-4 top-20 bottom-24 w-92 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md z-30 flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <FileIcon className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-sm text-white">Peer File Transfer</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Encryption Key Bar */}
      <div className="mt-3 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="flex items-center space-x-1 font-medium text-slate-300">
            <Lock className={`w-3.5 h-3.5 ${isKeyConfigured ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>E2E AES-256-GCM</span>
          </span>
          <span className={`text-[10px] font-mono ${isKeyConfigured ? 'text-emerald-400' : 'text-slate-500'}`}>
            {isKeyConfigured ? 'PROTECTED' : 'OPTIONAL PASSPHRASE'}
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          <input
            type="password"
            placeholder="Room secret passphrase..."
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 transition"
          />
          <button
            onClick={handleApplyPassphrase}
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition flex items-center space-x-1"
          >
            <Key className="w-3 h-3" />
            <span>Set</span>
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="mt-3">
        <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-700 hover:border-blue-500/80 rounded-xl cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition group">
          <UploadCloud className="w-7 h-7 text-slate-400 group-hover:text-blue-400 transition mb-1" />
          <span className="text-xs font-medium text-slate-200">Send Encrypted File</span>
          <span className="text-[10px] text-slate-400 mt-0.5">SCTP DataChannel • 64KB Chunking</span>
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
      <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
          Received Files ({receivedFiles.length})
        </div>

        {receivedFiles.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
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
                  <div className="flex items-center space-x-1 truncate">
                    <p className="text-xs font-medium text-white truncate">{f.name}</p>
                    {f.isEncrypted && <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />}
                  </div>
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
