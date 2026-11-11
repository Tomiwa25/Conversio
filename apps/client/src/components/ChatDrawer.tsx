'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWebRTC } from '../context/webrtc.context';
import { X, Send, Lock, Globe, MessageSquare } from 'lucide-react';

export const ChatDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { manager, state } = useWebRTC();
  const [inputText, setInputText] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('everyone');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      manager.markChatAsRead();
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.chatMessages, isOpen, manager]);

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    let targetName: string | undefined = undefined;
    if (selectedRecipientId !== 'everyone') {
      const targetPeer = state.participants.find((p) => p.id === selectedRecipientId);
      targetName = targetPeer?.name;
    }

    manager.sendChatMessage(inputText, selectedRecipientId, targetName);
    setInputText('');
  };

  const recipientParticipant = state.participants.find((p) => p.id === selectedRecipientId);

  return (
    <div className="fixed top-0 right-0 h-[calc(100vh-5rem)] w-88 md:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-30 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">In-Meeting Chat</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          aria-label="Close Chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Recipient Picker */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">To:</span>
        <div className="flex items-center space-x-1.5 flex-1 ml-2">
          {selectedRecipientId === 'everyone' ? (
            <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          )}
          <select
            value={selectedRecipientId}
            onChange={(e) => setSelectedRecipientId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="everyone">Everyone (Public Meeting)</option>
            {state.participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.role === 'host' ? '(Host)' : ''} (Direct Message)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {state.chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <MessageSquare className="w-10 h-10 mb-2 stroke-1 text-slate-600" />
            <p className="text-xs font-medium">No messages yet.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Say hello or send a direct question to anyone in the meeting!
            </p>
          </div>
        ) : (
          state.chatMessages.map((msg) => {
            const isMe = msg.senderId === state.currentUser?.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Sender & Timestamp */}
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mb-1 px-1">
                  <span className="font-semibold text-slate-300">
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  {msg.isPrivate && (
                    <span className="inline-flex items-center space-x-0.5 text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/20">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Direct</span>
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed break-words shadow-sm ${
                    isMe
                      ? msg.isPrivate
                        ? 'bg-amber-600/90 text-white rounded-tr-none'
                        : 'bg-blue-600 text-white rounded-tr-none'
                      : msg.isPrivate
                      ? 'bg-slate-800 border border-amber-500/30 text-slate-200 rounded-tl-none'
                      : 'bg-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              selectedRecipientId === 'everyone'
                ? 'Send message to Everyone...'
                : `Direct message to ${recipientParticipant?.name || 'user'}...`
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-1.5 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition"
            title="Send Message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
