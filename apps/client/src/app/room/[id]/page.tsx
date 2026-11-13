'use client';

import React, { useEffect, useState, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { WebRTCProvider, useWebRTC } from '../../../context/webrtc.context';
import { VideoGrid } from '../../../components/VideoGrid';
import { RoomControls } from '../../../components/RoomControls';
import { Whiteboard } from '../../../components/Whiteboard';
import { FileShare } from '../../../components/FileShare';
import { ChatDrawer } from '../../../components/ChatDrawer';
import { ParticipantsDrawer } from '../../../components/ParticipantsDrawer';
import { DeviceSettingsModal } from '../../../components/DeviceSettingsModal';
import { BreakoutRoomsModal } from '../../../components/BreakoutRoomsModal';
import { VirtualWaitingRoom } from '../../../components/VirtualWaitingRoom';
import { Loader2, Lock, ArrowLeft, MicOff, UserX } from 'lucide-react';
import { RoomRole } from '@conversio/shared';

function ConferenceRoom({ roomId }: { roomId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { manager, state } = useWebRTC();

  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isFileShareOpen, setIsFileShareOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isBreakoutRoomsOpen, setIsBreakoutRoomsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'audio' | 'video'>('audio');

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

  // Host Removed View
  if (state.isRemovedByHost) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-glass border border-line rounded-panel p-8 text-center space-y-5 animate-rise">
          <div className="w-11 h-11 rounded-panel bg-pulse/10 border border-pulse/25 text-pulse flex items-center justify-center mx-auto">
            <UserX className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-display text-chalk">Meeting ended</h2>
            <p className="text-xs text-muted leading-relaxed">
              {state.errorMessage || 'You have been removed from the meeting by the host.'}
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 bg-chalk/[0.06] hover:bg-chalk/10 border border-line text-chalk rounded-control text-xs font-medium transition flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to home</span>
          </button>
        </div>
      </div>
    );
  }

  // Meeting Locked / Access Denied View
  if (state.connectionStatus === 'error') {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-glass border border-line rounded-panel p-8 text-center animate-rise">
          <div className="w-11 h-11 rounded-panel bg-pulse/10 border border-pulse/25 text-pulse flex items-center justify-center mx-auto mb-5">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-display text-chalk mb-2">Meeting locked</h2>
          <p className="text-xs text-muted mb-6 leading-relaxed">
            {state.errorMessage?.includes('locked')
              ? 'The host has locked this meeting. No new participants can join at this time. Please contact the host to unlock the meeting.'
              : state.errorMessage || 'Unable to join this meeting.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 bg-chalk/[0.06] hover:bg-chalk/10 border border-line text-chalk rounded-control text-xs font-medium transition flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to home</span>
          </button>
        </div>
      </div>
    );
  }

  // Virtual Waiting Room
  if (state.isWaitingRoom) {
    return <VirtualWaitingRoom title={state.room?.title} />;
  }

  // Connecting Spinner View
  if (state.connectionStatus === 'connecting') {
    return (
      <div className="min-h-screen bg-ink flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-7 h-7 text-signal animate-spin" />
        <p className="text-sm font-medium text-chalk">Connecting to meeting…</p>
        <span className="text-xs text-muted">Preparing your audio, video, and collaboration tools</span>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-ink flex flex-col overflow-hidden select-none">
      {/* Host Muted Notification Banner */}
      {state.hostMutedNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-glass border border-line px-4 py-2.5 rounded-panel shadow-float backdrop-blur-xl flex items-center space-x-3 animate-rise">
          <div className="p-1 rounded-control bg-pulse/10 text-pulse">
            <MicOff className="w-4 h-4" />
          </div>
          <div className="text-xs text-chalk/80">
            The host has muted your microphone. You can unmute when you are ready to speak.
          </div>
          <button
            onClick={() => manager.clearHostMutedNotification()}
            className="px-2.5 py-1 rounded-control bg-chalk/[0.06] hover:bg-chalk/10 border border-line text-chalk text-xs font-medium transition"
          >
            OK
          </button>
        </div>
      )}

      {/* Video Meeting Grid */}
      <VideoGrid />

      {/* Shared Interactive Whiteboard */}
      <Whiteboard isOpen={isWhiteboardOpen} onClose={() => setIsWhiteboardOpen(false)} />

      {/* File Sharing Drawer */}
      <FileShare isOpen={isFileShareOpen} onClose={() => setIsFileShareOpen(false)} />

      {/* In-Meeting Chat Drawer */}
      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Participants & Host Moderation Drawer */}
      <ParticipantsDrawer isOpen={isParticipantsOpen} onClose={() => setIsParticipantsOpen(false)} />

      {/* Breakout Small Groups Modal */}
      <BreakoutRoomsModal
        isOpen={isBreakoutRoomsOpen}
        onClose={() => setIsBreakoutRoomsOpen(false)}
      />

      {/* Audio & Video Device Settings Modal */}
      <DeviceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaultTab={settingsTab}
      />

      {/* Bottom Meeting Controls Bar */}
      <RoomControls
        onToggleWhiteboard={() => setIsWhiteboardOpen((prev) => !prev)}
        isWhiteboardOpen={isWhiteboardOpen}
        onToggleFileShare={() => setIsFileShareOpen((prev) => !prev)}
        isFileShareOpen={isFileShareOpen}
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
        isChatOpen={isChatOpen}
        onToggleParticipants={() => setIsParticipantsOpen((prev) => !prev)}
        isParticipantsOpen={isParticipantsOpen}
        onToggleBreakoutRooms={() => setIsBreakoutRoomsOpen((prev) => !prev)}
        isBreakoutRoomsOpen={isBreakoutRoomsOpen}
        onOpenSettings={(tab) => {
          setSettingsTab(tab || 'audio');
          setIsSettingsOpen(true);
        }}
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
