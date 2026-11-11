'use client';

import React, { useState, useEffect } from 'react';
import { useWebRTC } from '../context/webrtc.context';
import { recordingManager, RecordingState } from '../services/recording.manager';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  Edit3,
  Share2,
  Lock,
  Unlock,
  PhoneOff,
  Copy,
  Check,
  Shield,
  ChevronUp,
  Smile,
  Hand,
  Users,
  MessageSquare,
  Settings,
  ShieldCheck,
  DoorOpen,
  Circle,
  Square,
  Sparkles,
} from 'lucide-react';

const REACTION_EMOJIS = ['👍', '👏', '❤️', '😂', '🎉', '😮'];

export interface ZoomControlBarProps {
  onToggleWhiteboard: () => void;
  isWhiteboardOpen: boolean;
  onToggleFileShare: () => void;
  isFileShareOpen: boolean;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onToggleParticipants: () => void;
  isParticipantsOpen: boolean;
  onToggleBreakoutRooms: () => void;
  isBreakoutRoomsOpen: boolean;
  onOpenSettings: (tab?: 'audio' | 'video') => void;
}

export const ZoomControlBar: React.FC<ZoomControlBarProps> = ({
  onToggleWhiteboard,
  isWhiteboardOpen,
  onToggleFileShare,
  isFileShareOpen,
  onToggleChat,
  isChatOpen,
  onToggleParticipants,
  isParticipantsOpen,
  onToggleBreakoutRooms,
  isBreakoutRoomsOpen,
  onOpenSettings,
}) => {
  const { manager, state } = useWebRTC();
  const [copied, setCopied] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>(recordingManager.getState());

  // Caret menus state
  const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
  const [isVideoMenuOpen, setIsVideoMenuOpen] = useState(false);
  const [isSecurityMenuOpen, setIsSecurityMenuOpen] = useState(false);
  const [isReactionsMenuOpen, setIsReactionsMenuOpen] = useState(false);
  const [isLeaveMenuOpen, setIsLeaveMenuOpen] = useState(false);

  useEffect(() => {
    return recordingManager.subscribe((recState) => {
      setRecordingState(recState);
    });
  }, []);

  // Close menus on outside click or escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAudioMenuOpen(false);
        setIsVideoMenuOpen(false);
        setIsSecurityMenuOpen(false);
        setIsReactionsMenuOpen(false);
        setIsLeaveMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isHost = state.currentUser?.role === 'host';
  const totalParticipants = state.participants.length + 1;
  const isWaitingRoomActive = state.room?.waitingRoomEnabled || false;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleLock = async () => {
    if (!state.roomId || !state.currentUser) return;
    setIsLocking(true);

    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
      const res = await fetch(`${serverUrl}/api/rooms/${state.roomId}/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(state.authToken ? { Authorization: `Bearer ${state.authToken}` } : {}),
        },
        body: JSON.stringify({
          isLocked: !state.isLocked,
          userId: state.currentUser.id,
          expectedVersion: state.lockVersion,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(`Meeting lock action failed: ${data.error || 'Please try again.'}`);
      }
    } catch (err) {
      console.error('Failed to update meeting lock:', err);
    } finally {
      setIsLocking(false);
      setIsSecurityMenuOpen(false);
    }
  };

  const handleToggleWaitingRoom = () => {
    manager.toggleWaitingRoom(!isWaitingRoomActive);
    setIsSecurityMenuOpen(false);
  };

  const handleSelectReaction = (emoji: string) => {
    manager.sendReaction(emoji);
    setIsReactionsMenuOpen(false);
  };

  const handleToggleRaiseHand = () => {
    manager.toggleRaiseHand();
    setIsReactionsMenuOpen(false);
  };

  const handleToggleRecording = async () => {
    if (recordingState.isRecording) {
      recordingManager.stopRecording();
      manager.broadcastRecordingStatus(false);
    } else {
      await recordingManager.startRecording({
        videoStream: state.screenStream || state.localStream,
        localAudioStream: state.localStream,
        remoteAudioStreams: Array.from(state.remoteStreams.values()),
      });
      manager.broadcastRecordingStatus(true);
    }
  };

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLeaveMeeting = () => {
    manager.disconnect();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <nav
      aria-label="Meeting Controls"
      className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800/80 rounded-2xl shadow-2xl px-2.5 sm:px-4 py-2 flex items-center justify-between space-x-1 sm:space-x-2 select-none pointer-events-auto"
    >
      {/* Left Group: Audio & Video with Carets */}
      <div className="flex items-center space-x-1 sm:space-x-1.5">
        {/* Audio Button + Caret */}
        <div className="relative flex items-center">
          <button
            onClick={() => manager.toggleAudio()}
            className={`flex flex-col items-center justify-center w-12 sm:w-14 h-12 rounded-l-xl transition group ${
              state.isAudioMuted
                ? 'bg-[#E02828]/20 hover:bg-[#E02828]/30 text-[#E02828]'
                : 'hover:bg-zinc-800 text-zinc-200'
            }`}
            title={state.isAudioMuted ? 'Unmute (Alt+A)' : 'Mute (Alt+A)'}
          >
            <div className="relative">
              {state.isAudioMuted ? (
                <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-[#E02828]" />
              ) : (
                <div className="flex items-center space-x-1">
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                  {/* Live Animated Audio Wave Bars */}
                  <span className="flex items-end space-x-0.5 h-3">
                    <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-pulse [animation-delay:150ms]" />
                    <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-pulse [animation-delay:300ms]" />
                  </span>
                </div>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none mt-1">
              {state.isAudioMuted ? 'Unmute' : 'Mute'}
            </span>
          </button>

          {/* Caret button */}
          <button
            onClick={() => {
              setIsAudioMenuOpen((prev) => !prev);
              setIsVideoMenuOpen(false);
              setIsSecurityMenuOpen(false);
              setIsReactionsMenuOpen(false);
            }}
            className="h-12 px-1 rounded-r-xl hover:bg-zinc-800 border-l border-zinc-800/80 text-zinc-400 hover:text-white transition flex items-center"
            title="Audio Settings"
          >
            <ChevronUp className="w-3 h-3" />
          </button>

          {/* Audio Popover */}
          {isAudioMenuOpen && (
            <div className="absolute bottom-14 left-0 w-60 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2.5 py-1">
                Audio Options
              </div>
              <button
                onClick={() => {
                  setIsAudioMenuOpen(false);
                  onOpenSettings('audio');
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-200 hover:bg-zinc-800 flex items-center space-x-2 transition"
              >
                <Settings className="w-3.5 h-3.5 text-[#0E71EB]" />
                <span>Audio Settings...</span>
              </button>
            </div>
          )}
        </div>

        {/* Video Button + Caret */}
        <div className="relative flex items-center">
          <button
            onClick={() => manager.toggleVideo()}
            className={`flex flex-col items-center justify-center w-12 sm:w-14 h-12 rounded-l-xl transition ${
              state.isVideoMuted
                ? 'bg-[#E02828]/20 hover:bg-[#E02828]/30 text-[#E02828]'
                : 'hover:bg-zinc-800 text-zinc-200'
            }`}
            title={state.isVideoMuted ? 'Start Video (Alt+V)' : 'Stop Video (Alt+V)'}
          >
            {state.isVideoMuted ? (
              <VideoOff className="w-4 h-4 sm:w-5 sm:h-5 text-[#E02828]" />
            ) : (
              <Video className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            <span className="text-[10px] font-medium leading-none mt-1">
              {state.isVideoMuted ? 'Start Video' : 'Stop Video'}
            </span>
          </button>

          {/* Caret button */}
          <button
            onClick={() => {
              setIsVideoMenuOpen((prev) => !prev);
              setIsAudioMenuOpen(false);
              setIsSecurityMenuOpen(false);
              setIsReactionsMenuOpen(false);
            }}
            className="h-12 px-1 rounded-r-xl hover:bg-zinc-800 border-l border-zinc-800/80 text-zinc-400 hover:text-white transition flex items-center"
            title="Video Options"
          >
            <ChevronUp className="w-3 h-3" />
          </button>

          {/* Video Popover */}
          {isVideoMenuOpen && (
            <div className="absolute bottom-14 left-0 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2.5 py-1">
                Video Options
              </div>
              <button
                onClick={() => {
                  manager.toggleBackgroundBlur();
                  setIsVideoMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-200 hover:bg-zinc-800 flex items-center justify-between transition"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#0E71EB]" />
                  <span>Blur My Background</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    state.isBackgroundBlurEnabled
                      ? 'bg-[#0E71EB]/20 text-[#0E71EB]'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {state.isBackgroundBlurEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
              <div className="pt-1 mt-1 border-t border-zinc-800">
                <button
                  onClick={() => {
                    setIsVideoMenuOpen(false);
                    onOpenSettings('video');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-200 hover:bg-zinc-800 flex items-center space-x-2 transition"
                >
                  <Settings className="w-3.5 h-3.5 text-[#0E71EB]" />
                  <span>Video Settings...</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-6 w-px bg-zinc-800 mx-0.5 hidden sm:block" />

      {/* Middle Group: Security, Participants, Chat, Share Screen, Record, Breakout, Reactions */}
      <div className="flex items-center space-x-1 sm:space-x-1.5">
        {/* Security Button (Shield) */}
        {isHost && (
          <div className="relative">
            <button
              onClick={() => {
                setIsSecurityMenuOpen((prev) => !prev);
                setIsAudioMenuOpen(false);
                setIsVideoMenuOpen(false);
                setIsReactionsMenuOpen(false);
              }}
              className={`flex flex-col items-center justify-center w-11 sm:w-13 h-12 rounded-xl transition ${
                state.isLocked
                  ? 'bg-amber-500/20 text-amber-400'
                  : isSecurityMenuOpen
                  ? 'bg-zinc-800 text-white'
                  : 'hover:bg-zinc-800 text-zinc-200'
              }`}
              title="Security Options"
            >
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] font-medium leading-none mt-1">Security</span>
            </button>

            {isSecurityMenuOpen && (
              <div className="absolute bottom-14 -left-12 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 space-y-1">
                <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2.5 py-1">
                  Host Meeting Security
                </div>

                <button
                  onClick={handleToggleLock}
                  disabled={isLocking}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-200 hover:bg-zinc-800 flex items-center justify-between transition"
                >
                  <div className="flex items-center space-x-2">
                    {state.isLocked ? (
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                    <span>Lock Meeting</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      state.isLocked ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {state.isLocked ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={handleToggleWaitingRoom}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-200 hover:bg-zinc-800 flex items-center justify-between transition"
                >
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0E71EB]" />
                    <span>Enable Waiting Room</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isWaitingRoomActive ? 'bg-[#0E71EB]/20 text-[#0E71EB]' : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {isWaitingRoomActive ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Participants Button with Count Badge */}
        <button
          onClick={onToggleParticipants}
          className={`flex flex-col items-center justify-center w-11 sm:w-14 h-12 rounded-xl transition relative ${
            isParticipantsOpen
              ? 'bg-[#0E71EB] text-white shadow-md shadow-[#0E71EB]/20'
              : 'hover:bg-zinc-800 text-zinc-200'
          }`}
          title="Participants"
        >
          {state.waitingParticipants.length > 0 && (
            <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
          <div className="relative">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute -top-1.5 -right-3 px-1 py-0.2 rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300 border border-zinc-700">
              {totalParticipants}
            </span>
          </div>
          <span className="text-[10px] font-medium leading-none mt-1">Participants</span>
        </button>

        {/* Chat Button with Unread Badge */}
        <button
          onClick={onToggleChat}
          className={`flex flex-col items-center justify-center w-11 sm:w-13 h-12 rounded-xl transition relative ${
            isChatOpen
              ? 'bg-[#0E71EB] text-white shadow-md shadow-[#0E71EB]/20'
              : 'hover:bg-zinc-800 text-zinc-200'
          }`}
          title="Chat"
        >
          {state.unreadChatCount > 0 && !isChatOpen && (
            <span className="absolute top-1 right-1.5 px-1.5 py-0.2 rounded-full bg-[#E02828] text-white text-[9px] font-extrabold shadow animate-bounce">
              {state.unreadChatCount}
            </span>
          )}
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-medium leading-none mt-1">Chat</span>
        </button>

        {/* Screen Share Button: Zoom Signature Green `#22C55E` with Upward Arrow */}
        <button
          onClick={() => {
            if (state.isScreenSharing) {
              manager.stopScreenShare();
            } else {
              manager.startScreenShare();
            }
          }}
          className={`flex flex-col items-center justify-center px-3 sm:px-4 h-12 rounded-xl transition shadow-md ${
            state.isScreenSharing
              ? 'bg-[#E02828] hover:bg-[#C81E1E] text-white'
              : 'bg-[#22C55E] hover:bg-emerald-600 text-white shadow-emerald-500/20'
          }`}
          title={state.isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
        >
          {state.isScreenSharing ? (
            <MonitorOff className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <MonitorUp className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
          <span className="text-[10px] font-bold leading-none mt-1">
            {state.isScreenSharing ? 'Stop Share' : 'Share Screen'}
          </span>
        </button>

        {/* Record Button with Live REC Indicator */}
        <button
          onClick={handleToggleRecording}
          className={`hidden md:flex flex-col items-center justify-center w-12 sm:w-14 h-12 rounded-xl transition ${
            recordingState.isRecording
              ? 'bg-rose-500/20 text-rose-400 animate-pulse'
              : 'hover:bg-zinc-800 text-zinc-200'
          }`}
          title={recordingState.isRecording ? 'Stop Recording' : 'Record to this Computer'}
        >
          {recordingState.isRecording ? (
            <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-[#E02828]" />
          ) : (
            <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 fill-rose-500/30" />
          )}
          <span className="text-[10px] font-medium leading-none mt-1">
            {recordingState.isRecording ? formatElapsed(recordingState.elapsedSeconds) : 'Record'}
          </span>
        </button>

        {/* Breakout Groups */}
        <button
          onClick={onToggleBreakoutRooms}
          className={`hidden sm:flex flex-col items-center justify-center w-11 sm:w-13 h-12 rounded-xl transition relative ${
            isBreakoutRoomsOpen || state.isBreakoutOpen
              ? 'bg-[#0E71EB] text-white'
              : 'hover:bg-zinc-800 text-zinc-200'
          }`}
          title="Breakout Rooms"
        >
          {state.isBreakoutOpen && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
          <DoorOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-medium leading-none mt-1">Breakout</span>
        </button>

        {/* Whiteboard Toggle */}
        <button
          onClick={onToggleWhiteboard}
          className={`hidden lg:flex flex-col items-center justify-center w-11 sm:w-13 h-12 rounded-xl transition ${
            isWhiteboardOpen ? 'bg-[#0E71EB] text-white' : 'hover:bg-zinc-800 text-zinc-200'
          }`}
          title="Whiteboards"
        >
          <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-medium leading-none mt-1">Whiteboard</span>
        </button>

        {/* Reactions / Raise Hand Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setIsReactionsMenuOpen((prev) => !prev);
              setIsAudioMenuOpen(false);
              setIsVideoMenuOpen(false);
              setIsSecurityMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center w-11 sm:w-13 h-12 rounded-xl transition ${
              state.isHandRaised
                ? 'bg-amber-500/20 text-amber-400'
                : isReactionsMenuOpen
                ? 'bg-zinc-800 text-white'
                : 'hover:bg-zinc-800 text-zinc-200'
            }`}
            title="Reactions"
          >
            {state.isHandRaised ? (
              <Hand className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-bounce" />
            ) : (
              <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            <span className="text-[10px] font-medium leading-none mt-1">
              {state.isHandRaised ? 'Hand' : 'Reactions'}
            </span>
          </button>

          {isReactionsMenuOpen && (
            <div className="absolute bottom-14 -left-16 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-bottom-2 space-y-2">
              <div className="flex items-center justify-between px-1">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSelectReaction(emoji)}
                    className="text-xl p-1 rounded-lg hover:bg-zinc-800 hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <button
                onClick={handleToggleRaiseHand}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                  state.isHandRaised
                    ? 'bg-amber-500 hover:bg-amber-600 text-zinc-950'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                }`}
              >
                <Hand className="w-3.5 h-3.5" />
                <span>{state.isHandRaised ? 'Lower Hand' : 'Raise Hand'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="h-6 w-px bg-zinc-800 mx-0.5" />

      {/* Right Group: Copy Invite + Red Leave/End Button */}
      <div className="flex items-center space-x-1.5">
        <button
          onClick={handleCopyLink}
          className="hidden xl:flex items-center space-x-1.5 px-3 py-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition text-xs font-medium"
          title="Copy Meeting Invite"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Invite'}</span>
        </button>

        {/* Far Right: Zoom Red Leave/End Button */}
        <div className="relative">
          {isHost ? (
            <div>
              <button
                onClick={() => setIsLeaveMenuOpen((prev) => !prev)}
                className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#E02828] hover:bg-[#C81E1E] text-white text-xs sm:text-sm font-semibold transition shadow-md shadow-[#E02828]/25 flex items-center space-x-1.5"
                title="End Meeting Options"
              >
                <PhoneOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>End</span>
              </button>

              {isLeaveMenuOpen && (
                <div className="absolute bottom-14 right-0 w-48 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 space-y-1">
                  <button
                    onClick={handleLeaveMeeting}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#E02828] hover:bg-rose-950/40 transition"
                  >
                    End Meeting for All
                  </button>
                  <button
                    onClick={handleLeaveMeeting}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition"
                  >
                    Leave Meeting
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleLeaveMeeting}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#E02828] hover:bg-[#C81E1E] text-white text-xs sm:text-sm font-semibold transition shadow-md shadow-[#E02828]/25 flex items-center space-x-1.5"
              title="Leave Meeting"
            >
              <PhoneOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Leave</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

