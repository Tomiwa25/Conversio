'use client';

import React, { useState } from 'react';
import { useWebRTC } from '../context/webrtc.context';
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
  ShieldAlert,
} from 'lucide-react';

const REACTION_EMOJIS = ['👍', '👏', '❤️', '😂', '🎉', '😮'];

export const RoomControls: React.FC<{
  onToggleWhiteboard: () => void;
  isWhiteboardOpen: boolean;
  onToggleFileShare: () => void;
  isFileShareOpen: boolean;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onToggleParticipants: () => void;
  isParticipantsOpen: boolean;
  onOpenSettings: (tab?: 'audio' | 'video') => void;
}> = ({
  onToggleWhiteboard,
  isWhiteboardOpen,
  onToggleFileShare,
  isFileShareOpen,
  onToggleChat,
  isChatOpen,
  onToggleParticipants,
  isParticipantsOpen,
  onOpenSettings,
}) => {
  const { manager, state } = useWebRTC();
  const [copied, setCopied] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  // Popover menus state
  const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
  const [isVideoMenuOpen, setIsVideoMenuOpen] = useState(false);
  const [isSecurityMenuOpen, setIsSecurityMenuOpen] = useState(false);
  const [isReactionsMenuOpen, setIsReactionsMenuOpen] = useState(false);
  const [isLeaveMenuOpen, setIsLeaveMenuOpen] = useState(false);

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

  /**
   * Host Meeting Lock Control
   */
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

  const handleLeaveMeeting = () => {
    manager.disconnect();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className="h-20 bg-slate-900/95 border-t border-slate-800/80 px-4 md:px-6 flex items-center justify-between backdrop-blur-md relative select-none">
      {/* Left: Meeting Info & Quick Actions */}
      <div className="flex items-center space-x-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white truncate max-w-[150px] md:max-w-[200px]">
            {state.room?.title || 'Team Meeting'}
          </span>
          <span className="text-[11px] text-slate-400">
            {totalParticipants} participant{totalParticipants === 1 ? '' : 's'}
          </span>
        </div>

        <button
          onClick={handleCopyLink}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center space-x-1.5 text-xs font-medium"
          title="Copy Invitation Link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline text-[11px]">{copied ? 'Copied' : 'Invite'}</span>
        </button>

        {state.isLocked && (
          <span className="hidden lg:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Lock className="w-3 h-3" />
            <span>Locked</span>
          </span>
        )}
      </div>

      {/* Center: Main Zoom-Style Control Bar */}
      <div className="flex items-center space-x-1.5 md:space-x-2.5">
        {/* Microphone with Caret */}
        <div className="relative flex items-center">
          <button
            onClick={() => manager.toggleAudio()}
            className={`flex flex-col items-center justify-center w-12 md:w-14 h-14 rounded-l-2xl transition shadow-md ${
              state.isAudioMuted
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={state.isAudioMuted ? 'Unmute' : 'Mute'}
          >
            {state.isAudioMuted ? <MicOff className="w-4 h-4 md:w-5 md:h-5" /> : <Mic className="w-4 h-4 md:w-5 md:h-5" />}
            <span className="text-[10px] mt-0.5 font-medium">{state.isAudioMuted ? 'Unmute' : 'Mute'}</span>
          </button>
          <button
            onClick={() => {
              setIsAudioMenuOpen((prev) => !prev);
              setIsVideoMenuOpen(false);
              setIsSecurityMenuOpen(false);
              setIsReactionsMenuOpen(false);
            }}
            className="h-14 px-1 rounded-r-2xl bg-slate-800/90 hover:bg-slate-700 border-l border-slate-700 text-slate-400 hover:text-white transition flex items-center"
            title="Audio Options"
          >
            <ChevronUp className="w-3 h-3" />
          </button>

          {/* Audio Quick Menu */}
          {isAudioMenuOpen && (
            <div className="absolute bottom-16 left-0 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                Audio Settings
              </div>
              <button
                onClick={() => {
                  setIsAudioMenuOpen(false);
                  onOpenSettings('audio');
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2 transition"
              >
                <Settings className="w-3.5 h-3.5 text-blue-400" />
                <span>Audio Settings...</span>
              </button>
            </div>
          )}
        </div>

        {/* Camera with Caret */}
        <div className="relative flex items-center">
          <button
            onClick={() => manager.toggleVideo()}
            className={`flex flex-col items-center justify-center w-12 md:w-14 h-14 rounded-l-2xl transition shadow-md ${
              state.isVideoMuted
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={state.isVideoMuted ? 'Start Video' : 'Stop Video'}
          >
            {state.isVideoMuted ? <VideoOff className="w-4 h-4 md:w-5 md:h-5" /> : <Video className="w-4 h-4 md:w-5 md:h-5" />}
            <span className="text-[10px] mt-0.5 font-medium">{state.isVideoMuted ? 'Start' : 'Stop'}</span>
          </button>
          <button
            onClick={() => {
              setIsVideoMenuOpen((prev) => !prev);
              setIsAudioMenuOpen(false);
              setIsSecurityMenuOpen(false);
              setIsReactionsMenuOpen(false);
            }}
            className="h-14 px-1 rounded-r-2xl bg-slate-800/90 hover:bg-slate-700 border-l border-slate-700 text-slate-400 hover:text-white transition flex items-center"
            title="Video Options"
          >
            <ChevronUp className="w-3 h-3" />
          </button>

          {/* Video Quick Menu */}
          {isVideoMenuOpen && (
            <div className="absolute bottom-16 left-0 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                Video Settings
              </div>
              <button
                onClick={() => {
                  setIsVideoMenuOpen(false);
                  onOpenSettings('video');
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2 transition"
              >
                <Settings className="w-3.5 h-3.5 text-blue-400" />
                <span>Video Settings...</span>
              </button>
            </div>
          )}
        </div>

        {/* Security Controls (Host Only) */}
        {isHost && (
          <div className="relative">
            <button
              onClick={() => {
                setIsSecurityMenuOpen((prev) => !prev);
                setIsAudioMenuOpen(false);
                setIsVideoMenuOpen(false);
                setIsReactionsMenuOpen(false);
              }}
              className={`flex flex-col items-center justify-center w-12 md:w-14 h-14 rounded-2xl transition shadow-md ${
                state.isLocked
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title="Meeting Security"
            >
              <Shield className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[10px] mt-0.5 font-medium">Security</span>
            </button>

            {isSecurityMenuOpen && (
              <div className="absolute bottom-16 -left-12 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1">
                  Host Security
                </div>

                <button
                  onClick={handleToggleLock}
                  disabled={isLocking}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between transition"
                >
                  <div className="flex items-center space-x-2">
                    {state.isLocked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-slate-400" />}
                    <span>Lock Meeting</span>
                  </div>
                  <span className={`text-[10px] font-semibold ${state.isLocked ? 'text-amber-400' : 'text-slate-500'}`}>
                    {state.isLocked ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={handleToggleWaitingRoom}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between transition"
                >
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span>Waiting Room</span>
                  </div>
                  <span className={`text-[10px] font-semibold ${isWaitingRoomActive ? 'text-blue-400' : 'text-slate-500'}`}>
                    {isWaitingRoomActive ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Participants Button */}
        <button
          onClick={onToggleParticipants}
          className={`flex flex-col items-center justify-center w-12 md:w-14 h-14 rounded-2xl transition shadow-md relative ${
            isParticipantsOpen
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title="Participants"
        >
          {state.waitingParticipants.length > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
          <Users className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-[10px] mt-0.5 font-medium">People</span>
        </button>

        {/* In-Meeting Chat Button */}
        <button
          onClick={onToggleChat}
          className={`flex flex-col items-center justify-center w-12 md:w-14 h-14 rounded-2xl transition shadow-md relative ${
            isChatOpen
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title="In-Meeting Chat"
        >
          {state.unreadChatCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold shadow-md">
              {state.unreadChatCount}
            </span>
          )}
          <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Chat</span>
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={() => {
            if (state.isScreenSharing) {
              manager.stopScreenShare();
            } else {
              manager.startScreenShare();
            }
          }}
          className={`flex flex-col items-center justify-center w-12 md:w-14 h-14 rounded-2xl transition shadow-md ${
            state.isScreenSharing
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title={state.isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        >
          {state.isScreenSharing ? <MonitorOff className="w-4 h-4 md:w-5 md:h-5" /> : <MonitorUp className="w-4 h-4 md:w-5 md:h-5" />}
          <span className="text-[10px] mt-0.5 font-medium">{state.isScreenSharing ? 'Sharing' : 'Share'}</span>
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
            className={`flex flex-col items-center justify-center w-12 md:w-14 h-14 rounded-2xl transition shadow-md ${
              state.isHandRaised
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Reactions"
          >
            {state.isHandRaised ? <Hand className="w-4 h-4 md:w-5 md:h-5 text-yellow-300" /> : <Smile className="w-4 h-4 md:w-5 md:h-5" />}
            <span className="text-[10px] mt-0.5 font-medium">{state.isHandRaised ? 'Hand' : 'React'}</span>
          </button>

          {isReactionsMenuOpen && (
            <div className="absolute bottom-16 -left-16 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-bottom-2 space-y-2">
              {/* Quick Emojis Grid */}
              <div className="flex items-center justify-between px-1">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSelectReaction(emoji)}
                    className="text-xl p-1 rounded-lg hover:bg-slate-800 hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Raise Hand Button */}
              <button
                onClick={handleToggleRaiseHand}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                  state.isHandRaised
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <Hand className="w-3.5 h-3.5" />
                <span>{state.isHandRaised ? 'Lower Hand' : 'Raise Hand'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Whiteboard Toggle */}
        <button
          onClick={onToggleWhiteboard}
          className={`hidden sm:flex flex-col items-center justify-center w-12 md:w-14 h-14 rounded-2xl transition shadow-md ${
            isWhiteboardOpen
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title="Whiteboard"
        >
          <Edit3 className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Board</span>
        </button>

        {/* Share Files Toggle */}
        <button
          onClick={onToggleFileShare}
          className={`hidden sm:flex flex-col items-center justify-center w-12 md:w-14 h-14 rounded-2xl transition shadow-md ${
            isFileShareOpen
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title="Share Files"
        >
          <Share2 className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Files</span>
        </button>
      </div>

      {/* Right: Leave / End Meeting Button */}
      <div className="relative">
        {isHost ? (
          <div>
            <button
              onClick={() => setIsLeaveMenuOpen((prev) => !prev)}
              className="px-4 md:px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center space-x-2 transition shadow-lg shadow-rose-900/30"
              title="End / Leave Meeting"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="text-xs font-semibold">End</span>
            </button>

            {isLeaveMenuOpen && (
              <div className="absolute bottom-16 right-0 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 space-y-1">
                <button
                  onClick={handleLeaveMeeting}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition"
                >
                  End Meeting for All
                </button>
                <button
                  onClick={handleLeaveMeeting}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  Leave Meeting
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleLeaveMeeting}
            className="px-4 md:px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center space-x-2 transition shadow-lg shadow-rose-900/30"
            title="Leave Meeting"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="text-xs font-semibold">Leave</span>
          </button>
        )}
      </div>
    </div>
  );
};
