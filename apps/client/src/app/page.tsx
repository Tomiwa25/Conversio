'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Video, ShieldCheck, Zap, Users, ArrowRight, Lock } from 'lucide-react';
import { IDEMPOTENCY_HEADER } from '@conversio/shared';

export default function LobbyPage() {
  const router = useRouter();

  // Create Room State
  const [roomTitle, setRoomTitle] = useState('');
  const [hostName, setHostName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Join Room State
  const [joinRoomId, setJoinRoomId] = useState('');
  const [participantName, setParticipantName] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Idempotent Room Creation
   */
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomTitle.trim() || !hostName.trim()) return;

    setIsCreating(true);
    setErrorMessage(null);

    // Generate client-side UUID idempotency key
    const idempotencyKey = crypto.randomUUID();
    const hostId = `user-${crypto.randomUUID().slice(0, 8)}`;

    try {
      const res = await fetch('http://localhost:4000/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [IDEMPOTENCY_HEADER]: idempotencyKey,
        },
        body: JSON.stringify({
          title: roomTitle.trim(),
          hostId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      const roomId = data.room.id;
      router.push(`/room/${roomId}?name=${encodeURIComponent(hostName)}&userId=${hostId}&role=host`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error creating room');
      setIsCreating(false);
    }
  };

  /**
   * Join Existing Room
   */
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomId.trim() || !participantName.trim()) return;

    const userId = `user-${crypto.randomUUID().slice(0, 8)}`;
    router.push(
      `/room/${joinRoomId.trim()}?name=${encodeURIComponent(participantName)}&userId=${userId}&role=participant`
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="px-8 py-6 border-b border-slate-800/80 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Conversio</span>
        </div>
        <div className="flex items-center space-x-4 text-xs text-slate-400 font-mono">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>WebRTC Active</span>
          </span>
          <span>•</span>
          <span>Dual DataChannels</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero-Race Idempotent Rooms & Dual-Channel SCTP Collaboration</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Real-Time Conferencing & Collaboration for Modern Teams
          </h1>
          <p className="mt-4 text-base text-slate-400 leading-relaxed">
            Multi-user WebRTC video calling, collaborative Fabric.js whiteboard, direct chunked file sharing, and atomic room locks.
          </p>
        </div>

        {errorMessage && (
          <div className="max-w-md mx-auto mb-6 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl text-center">
            {errorMessage}
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
          {/* Card 1: Create New Room */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5 text-blue-400">
                <Zap className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Create New Meeting</h2>
              <p className="text-xs text-slate-400 mb-6">
                Instant room creation backed by client-side UUID idempotency keys to prevent duplicate rooms on retries.
              </p>

              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Meeting Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Architecture Sync"
                    value={roomTitle}
                    onChange={(e) => setRoomTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20"
                >
                  <span>{isCreating ? 'Creating Room...' : 'Start Meeting as Host'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Card 2: Join Existing Room */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 text-indigo-400">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Join a Meeting</h2>
              <p className="text-xs text-slate-400 mb-6">
                Enter an existing Room ID. Admittance is verified against the host's real-time room lock state.
              </p>

              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Room ID</label>
                  <input
                    type="text"
                    required
                    placeholder="Paste Room UUID..."
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20"
                >
                  <span>Join Meeting</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        Conversio • Senior Real-Time WebRTC Architecture • Next.js & Node.js
      </footer>
    </div>
  );
}

