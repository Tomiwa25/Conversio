'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWebRTC } from '../context/webrtc.context';
import { ParticipantGrid } from './ParticipantGrid';
import { ZoomControlBar } from './ZoomControlBar';
import { Whiteboard } from './Whiteboard';
import { FileShare } from './FileShare';
import { ChatDrawer } from './ChatDrawer';
import { ParticipantsDrawer } from './ParticipantsDrawer';
import { DeviceSettingsModal } from './DeviceSettingsModal';
import { BreakoutRoomsModal } from './BreakoutRoomsModal';
import { VirtualWaitingRoom } from './VirtualWaitingRoom';
import { Loader2, Lock, ArrowLeft, MicOff, UserX } from 'lucide-react';
import { RoomRole } from '@conversio/shared';

export interface MeetingRoomProps {
  roomId: string;
}

export const MeetingRoom: React.FC<MeetingRoomProps> = ({ roomId }) => {
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
      <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center p-6 select-none">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-[#E02828] flex items-center justify-center mx-auto">
            <UserX className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Meeting Ended</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {state.errorMessage || 'You have been removed from the meeting by the host.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 bg-[#0E71EB] hover:bg-[#005CE6] text-white rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2 shadow-lg shadow-[#0E71EB]/25"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </button>
        </div>
      </div>
    );
  }

  // Meeting Locked / Access Denied View
  if (state.connectionStatus === 'error') {
    return (
      <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center p-6 select-none">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Meeting Locked</h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            {state.errorMessage?.includes('locked')
              ? 'The host has locked this meeting. No new participants can join at this time. Please contact the host to unlock the meeting.'
              : state.errorMessage || 'Unable to join this meeting.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 bg-[#0E71EB] hover:bg-[#005CE6] text-white rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2 shadow-lg shadow-[#0E71EB]/25"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
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
      <div className="min-h-screen bg-[#0F0F12] flex flex-col items-center justify-center p-6 space-y-4 select-none">
        <Loader2 className="w-8 h-8 text-[#0E71EB] animate-spin" />
        <p className="text-sm font-semibold text-white">Connecting to Zoom meeting...</p>
        <span className="text-xs text-zinc-400">Preparing your audio, video, and collaboration tools</span>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-[#0F0F12] flex flex-col overflow-hidden select-none">
      {/* Host Muted Notification Banner */}
      {state.hostMutedNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-zinc-900/95 border border-zinc-800 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center space-x-3 animate-in fade-in slide-in-from-top-3">
          <div className="p-1 rounded-lg bg-rose-500/10 text-[#E02828]">
            <MicOff className="w-4 h-4" />
          </div>
          <div className="text-xs text-zinc-200">
            The host has muted your microphone. You can unmute when you are ready to speak.
          </div>
          <button
            onClick={() => manager.clearHostMutedNotification()}
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition"
          >
            OK
          </button>
        </div>
      )}

      {/* Main Meeting Row: Dynamic Video Grid + Docked Side Drawers */}
      <div className="flex-1 flex flex-row overflow-hidden relative min-h-0">
        {/* Main Video Meeting Area */}
        <div className="flex-1 flex flex-col relative h-full min-w-0 overflow-hidden">
          {/* Zoom Responsive Video Tile Grid */}
          <ParticipantGrid />

          {/* Floating Zoom Control Bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[95vw]">
            <ZoomControlBar
              onToggleWhiteboard={() => setIsWhiteboardOpen((prev) => !prev)}
              isWhiteboardOpen={isWhiteboardOpen}
              onToggleFileShare={() => setIsFileShareOpen((prev) => !prev)}
              isFileShareOpen={isFileShareOpen}
              onToggleChat={() => {
                setIsChatOpen((prev) => !prev);
              }}
              isChatOpen={isChatOpen}
              onToggleParticipants={() => {
                setIsParticipantsOpen((prev) => !prev);
              }}
              isParticipantsOpen={isParticipantsOpen}
              onToggleBreakoutRooms={() => setIsBreakoutRoomsOpen((prev) => !prev)}
              isBreakoutRoomsOpen={isBreakoutRoomsOpen}
              onOpenSettings={(tab) => {
                setSettingsTab(tab || 'audio');
                setIsSettingsOpen(true);
              }}
            />
          </div>
        </div>

        {/* Docked Slide-Over Right Drawers (Resize Video Grid cleanly without overlap) */}
        <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        <ParticipantsDrawer isOpen={isParticipantsOpen} onClose={() => setIsParticipantsOpen(false)} />
      </div>

      {/* Shared Interactive Whiteboard */}
      <Whiteboard isOpen={isWhiteboardOpen} onClose={() => setIsWhiteboardOpen(false)} />

      {/* File Sharing Drawer */}
      <FileShare isOpen={isFileShareOpen} onClose={() => setIsFileShareOpen(false)} />

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
    </div>
  );
};

