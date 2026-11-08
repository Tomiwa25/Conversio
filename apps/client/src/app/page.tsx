'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Video, ShieldCheck, Plus, Users, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { IDEMPOTENCY_HEADER } from '@conversio/shared';

export default function LobbyPage() {
  const router = useRouter();

  // New Meeting State
  const [meetingTopic, setMeetingTopic] = useState('');
  const [hostName, setHostName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Join Meeting State
  const [joinMeetingId, setJoinMeetingId] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';

  /**
   * Start New Meeting
   */
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTopic.trim() || !hostName.trim()) return;

    setIsCreating(true);
    setErrorMessage(null);

    const idempotencyKey = crypto.randomUUID();
    const hostId = `user-${crypto.randomUUID().slice(0, 8)}`;

    try {
      const res = await fetch(`${serverUrl}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [IDEMPOTENCY_HEADER]: idempotencyKey,
        },
        body: JSON.stringify({
          title: meetingTopic.trim(),
          hostId,
          hostName: hostName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start meeting');
      }

      const roomId = data.room.id;
      const token = data.token;
      router.push(
        `/room/${roomId}?token=${encodeURIComponent(token)}&name=${encodeURIComponent(hostName)}&userId=${hostId}&role=host`
      );
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error starting meeting');
      setIsCreating(false);
    }
  };

  /**
   * Join Existing Meeting
   */
  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinMeetingId.trim() || !participantName.trim()) return;

    setIsJoining(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${serverUrl}/api/rooms/${joinMeetingId.trim()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: participantName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join meeting');
      }

      const roomId = data.room.id;
      const token = data.token;
      const userId = data.userId;

      router.push(
        `/room/${roomId}?token=${encodeURIComponent(token)}&name=${encodeURIComponent(participantName)}&userId=${userId}&role=participant`
      );
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error joining meeting');
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="px-6 md:px-12 py-5 border-b border-slate-800/80 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">Conversio</span>
            <span className="hidden sm:inline-block ml-2 text-xs text-blue-400 font-medium px-2 py-0.5 rounded-full bg-blue-500/10">
              Meetings
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3 text-xs text-slate-300">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted & Secure</span>
          </span>
        </div>
      </header>

      {/* Main Hero & Action Cards */}
      <main className="max-w-5xl mx-auto px-6 py-10 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HD Video Meetings & Team Collaboration</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Connect and collaborate with your team anywhere
          </h1>
          <p className="mt-3 text-sm md:text-base text-slate-400">
            High-definition video calls, interactive shared whiteboard, direct file transfers, and instant meeting controls.
          </p>
        </div>

        {errorMessage && (
          <div className="max-w-md mx-auto mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-2xl text-center shadow-lg">
            {errorMessage}
          </div>
        )}

        {/* Meeting Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
          {/* Card 1: New Meeting */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-7 shadow-xl flex flex-col justify-between hover:border-slate-700/80 transition">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
                <Plus className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">New Meeting</h2>
              <p className="text-xs text-slate-400 mb-5">
                Start an instant meeting as host and invite colleagues to collaborate.
              </p>

              <form onSubmit={handleCreateMeeting} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Meeting Topic</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Design Review, Morning Standup"
                    value={meetingTopic}
                    onChange={(e) => setMeetingTopic(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Smith"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/25"
                >
                  <span>{isCreating ? 'Setting up meeting...' : 'Start Meeting'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Card 2: Join Meeting */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-7 shadow-xl flex flex-col justify-between hover:border-slate-700/80 transition">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Join Meeting</h2>
              <p className="text-xs text-slate-400 mb-5">
                Enter an invitation ID or meeting link to enter an active session.
              </p>

              <form onSubmit={handleJoinMeeting} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Meeting ID</label>
                  <input
                    type="text"
                    required
                    placeholder="Paste meeting ID..."
                    value={joinMeetingId}
                    onChange={(e) => setJoinMeetingId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan Lee"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/25"
                >
                  <span>{isJoining ? 'Joining...' : 'Join Meeting'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-5 border-t border-slate-800/80 text-center text-xs text-slate-500">
        Conversio • Simple, Secure Real-Time Meetings
      </footer>
    </div>
  );
}
