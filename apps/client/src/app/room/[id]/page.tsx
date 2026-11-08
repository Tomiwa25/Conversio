'use client';

import React, { useEffect, useState, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { WebRTCProvider, useWebRTC } from '../../../context/webrtc.context';
import { VideoGrid } from '../../../components/VideoGrid';
import { RoomControls } from '../../../components/RoomControls';
import { Whiteboard } from '../../../components/Whiteboard';
import { FileShare } from '../../../components/FileShare';
import { Loader2, Lock, ArrowLeft } from 'lucide-react';
import { RoomRole } from '@conversio/shared';

function ConferenceRoom({ roomId }: { roomId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { manager, state } = useWebRTC();

  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isFileShareOpen, setIsFileShareOpen] = useState(false);

  const participantName = searchParams.get('name') || 'Guest';
  const userId = searchParams.get('userId') || `user-${Math.random().toString(36).slice(2, 9)}`;
  const role = (searchParams.get('role') as RoomRole) || 'participant';
  const token = searchParams.get('token') || undefined;

  useEffect(() => {
    // Join WebRTC room on mount with cryptographic admission token
    manager.joinRoom(
      roomId,
      {
        id: userId,
        name: participantName,
        role,
        isAudioMuted: false,
        isVideoMuted: false,
        isScreenSharing: false,
      },
      token
    );

    return () => {
      manager.disconnect();
    };
  }, [roomId, userId, participantName, role, token, manager]);

  // Meeting Locked / Access Denied View
  if (state.connectionStatus === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Meeting Locked</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            {state.errorMessage?.includes('locked')
              ? 'The host has locked this meeting. No new participants can join at this time. Please contact the host to unlock the meeting.'
              : state.errorMessage || 'Unable to join this meeting.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </button>
        </div>
      </div>
    );
  }

  // Connecting Spinner View
  if (state.connectionStatus === 'connecting') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-semibold text-white">Connecting to meeting...</p>
        <span className="text-xs text-slate-400">Preparing your audio, video, and collaboration tools</span>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* Video Meeting Grid */}
      <VideoGrid />

      {/* Shared Interactive Whiteboard */}
      <Whiteboard isOpen={isWhiteboardOpen} onClose={() => setIsWhiteboardOpen(false)} />

      {/* File Sharing Drawer */}
      <FileShare isOpen={isFileShareOpen} onClose={() => setIsFileShareOpen(false)} />

      {/* Bottom Meeting Controls Bar */}
      <RoomControls
        onToggleWhiteboard={() => setIsWhiteboardOpen((prev) => !prev)}
        isWhiteboardOpen={isWhiteboardOpen}
        onToggleFileShare={() => setIsFileShareOpen((prev) => !prev)}
        isFileShareOpen={isFileShareOpen}
      />
    </div>
  );
}

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);

  return (
    <WebRTCProvider>
      <ConferenceRoom roomId={unwrappedParams.id} />
    </WebRTCProvider>
  );
}
