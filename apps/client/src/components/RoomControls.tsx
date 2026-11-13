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
  ShieldAlert,
  DoorOpen,
  Circle,
  Square,
  Sparkles,
} from 'lucide-react';

const REACTION_EMOJIS = ['👍', '👏', '❤️', '😂', '🎉', '😮'];

/**
 * Control bar key. Quiet chrome: one neutral resting state, one signal state
 * for "on", and pulse reserved for genuinely destructive/urgent states
 * (muted, recording). Every accent hue the old bar used collapses into these.
 */
const ControlButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  urgent?: boolean;
  title?: string;
  className?: string;
  badge?: React.ReactNode;
}> = ({ icon, label, onClick, active, urgent, title, className = '', badge }) => (
  <button
    onClick={onClick}
    title={title || label}
    className={`relative flex flex-col items-center justify-center w-12 md:w-14 h-14 rounded-control border transition-colors duration-200 ${
      urgent
        ? 'bg-pulse/15 border-pulse/40 text-pulse hover:bg-pulse/25'
        : active
        ? 'bg-signal/15 border-signal/40 text-signal hover:bg-signal/25'
        : 'bg-chalk/[0.04] border-line text-chalk/70 hover:bg-chalk/[0.08] hover:text-chalk'
    } ${className}`}
  >
    {badge}
    {icon}
    <span className="text-[10px] mt-1 font-medium tracking-wide">{label}</span>
  </button>
);

export const RoomControls: React.FC<{
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
}> = ({
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

  useEffect(() => {
    return recordingManager.subscribe((recState) => {
      setRecordingState(recState);
    });
  }, []);

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
    <div className="h-20 bg-glass/80 border-t border-line px-4 md:px-6 flex items-center justify-between backdrop-blur-xl relative select-none">
      {/* Left: Meeting Info & Quick Actions */}
      <div className="flex items-center space-x-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-chalk truncate max-w-[150px] md:max-w-[200px]">
            {state.room?.title || 'Team Meeting'}
          </span>
          <span className="text-[11px] text-muted">
            {totalParticipants} participant{totalParticipants === 1 ? '' : 's'}
          </span>
        </div>

        <button
          onClick={handleCopyLink}
          className="p-1.5 rounded-control bg-chalk/[0.04] hover:bg-chalk/[0.08] border border-line text-chalk/70 hover:text-chalk transition flex items-center space-x-1.5"
          title="Copy Invitation Link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-signal" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline text-[11px] font-medium">{copied ? 'Copied' : 'Invite'}</span>
        </button>

        {state.isLocked && (
          <span className="hidden lg:inline-flex items-center space-x-1 px-2 py-1 rounded-control text-[10px] font-medium bg-chalk/[0.04] text-muted border border-line">
            <Lock className="w-3 h-3" />
            <span>Locked</span>
          </span>
        )}

        {(state.isRecording || recordingState.isRecording) && (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-control bg-pulse/15 border border-pulse/40 text-pulse text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-pulse animate-soft-pulse" />
            <span className="tracking-wide">
              {recordingState.isRecording ? `REC ${formatElapsed(recordingState.elapsedSeconds)}` : 'RECORDING'}
            </span>
            {state.recorderName && !recordingState.isRecording && (
              <span className="text-[10px] text-muted font-normal hidden xl:inline">({state.recorderName})</span>
            )}
          </div>
        )}
      </div>

      {/* Center: Main Control Bar */}
      <div className="flex items-center space-x-1.5 md:space-x-2">
        {/* Microphone with Caret */}
        <div className="relative flex items-center">
          <ControlButton
            icon={state.isAudioMuted ? <MicOff className="w-4 h-4 md:w-5 md:h-5" /> : <Mic className="w-4 h-4 md:w-5 md:h-5" />}
            label={state.isAudioMuted ? 'Unmute' : 'Mute'}
            urgent={state.isAudioMuted}
            onClick={() => manager.toggleAudio()}
            title={state.isAudioMuted ? 'Unmute' : 'Mute'}
            className="rounded-r-none"
          />
          <button
            onClick={() => {
              setIsAudioMenuOpen((prev) => !prev);
              setIsVideoMenuOpen(false);
              setIsSecurityMenuOpen(false);
              setIsReactionsMenuOpen(false);
            }}
            className="h-14 px-1 rounded-r-control rounded-l-none bg-chalk/[0.04] hover:bg-chalk/[0.08] border border-line border-l-0 text-chalk/50 hover:text-chalk transition flex items-center"
            title="Audio Options"
          >
            <ChevronUp className="w-3 h-3" />
          </button>

          {/* Audio Quick Menu */}
          {isAudioMenuOpen && (
            <div className="absolute bottom-16 left-0 w-56 bg-glass border border-line rounded-panel shadow-float p-1.5 z-50 animate-rise">
              <div className="text-[10px] font-medium text-muted uppercase tracking-[0.12em] px-2.5 py-1.5">
                Audio
              </div>
              <button
                onClick={() => {
                  setIsAudioMenuOpen(false);
                  onOpenSettings('audio');
                }}
                className="w-full text-left px-2.5 py-2 rounded-control text-xs text-chalk/80 hover:bg-chalk/[0.06] hover:text-chalk flex items-center space-x-2 transition"
              >
                <Settings className="w-3.5 h-3.5 text-muted" />
                <span>Audio settings…</span>
              </button>
            </div>
          )}
        </div>

        {/* Camera with Caret */}
        <div className="relative flex items-center">
          <ControlButton
            icon={state.isVideoMuted ? <VideoOff className="w-4 h-4 md:w-5 md:h-5" /> : <Video className="w-4 h-4 md:w-5 md:h-5" />}
            label={state.isVideoMuted ? 'Start' : 'Stop'}
            urgent={state.isVideoMuted}
            onClick={() => manager.toggleVideo()}
            title={state.isVideoMuted ? 'Start Video' : 'Stop Video'}
            className="rounded-r-none"
          />
          <button
            onClick={() => {
              setIsVideoMenuOpen((prev) => !prev);
              setIsAudioMenuOpen(false);
              setIsSecurityMenuOpen(false);
              setIsReactionsMenuOpen(false);
            }}
            className="h-14 px-1 rounded-r-control rounded-l-none bg-chalk/[0.04] hover:bg-chalk/[0.08] border border-line border-l-0 text-chalk/50 hover:text-chalk transition flex items-center"
            title="Video Options"
          >
            <ChevronUp className="w-3 h-3" />
          </button>

          {/* Video Quick Menu */}
          {isVideoMenuOpen && (
            <div className="absolute bottom-16 left-0 w-56 bg-glass border border-line rounded-panel shadow-float p-1.5 z-50 animate-rise">
              <div className="text-[10px] font-medium text-muted uppercase tracking-[0.12em] px-2.5 py-1.5">
                Video
              </div>
              <button
                onClick={() => {
                  setIsVideoMenuOpen(false);
                  onOpenSettings('video');
                }}
                className="w-full text-left px-2.5 py-2 rounded-control text-xs text-chalk/80 hover:bg-chalk/[0.06] hover:text-chalk flex items-center space-x-2 transition"
              >
                <Settings className="w-3.5 h-3.5 text-muted" />
                <span>Video settings…</span>
              </button>

              <div className="mt-1 pt-1 border-t border-line">
                <button
                  onClick={() => {
                    manager.toggleBackgroundBlur();
                    setIsVideoMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-control text-xs text-chalk/80 hover:bg-chalk/[0.06] hover:text-chalk flex items-center justify-between transition"
                >
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-muted" />
                    <span>Blur background</span>
                  </div>
                  <span className={`text-[10px] font-medium tracking-wide ${state.isBackgroundBlurEnabled ? 'text-signal' : 'text-muted/70'}`}>
                    {state.isBackgroundBlurEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Controls (Host Only) */}
        {isHost && (
          <div className="relative">
            <ControlButton
              icon={<Shield className="w-4 h-4 md:w-5 md:h-5" />}
              label="Security"
              active={state.isLocked}
              onClick={() => {
                setIsSecurityMenuOpen((prev) => !prev);
                setIsAudioMenuOpen(false);
                setIsVideoMenuOpen(false);
                setIsReactionsMenuOpen(false);
              }}
              title="Meeting Security"
            />

            {isSecurityMenuOpen && (
              <div className="absolute bottom-16 -left-12 w-64 bg-glass border border-line rounded-panel shadow-float p-1.5 z-50 animate-rise">
                <div className="text-[10px] font-medium text-muted uppercase tracking-[0.12em] px-2.5 py-1.5">
                  Host security
                </div>

                <button
                  onClick={handleToggleLock}
                  disabled={isLocking}
                  className="w-full text-left px-2.5 py-2 rounded-control text-xs text-chalk/80 hover:bg-chalk/[0.06] hover:text-chalk flex items-center justify-between transition disabled:opacity-50"
                >
                  <div className="flex items-center space-x-2">
                    {state.isLocked ? <Lock className="w-4 h-4 text-signal" /> : <Unlock className="w-4 h-4 text-muted" />}
                    <span>Lock meeting</span>
                  </div>
                  <span className={`text-[10px] font-medium tracking-wide ${state.isLocked ? 'text-signal' : 'text-muted/70'}`}>
                    {state.isLocked ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={handleToggleWaitingRoom}
                  className="w-full text-left px-2.5 py-2 rounded-control text-xs text-chalk/80 hover:bg-chalk/[0.06] hover:text-chalk flex items-center justify-between transition"
                >
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-muted" />
                    <span>Waiting room</span>
                  </div>
                  <span className={`text-[10px] font-medium tracking-wide ${isWaitingRoomActive ? 'text-signal' : 'text-muted/70'}`}>
                    {isWaitingRoomActive ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Participants Button */}
        <ControlButton
          icon={<Users className="w-4 h-4 md:w-5 md:h-5" />}
          label="People"
          active={isParticipantsOpen}
          onClick={onToggleParticipants}
          badge={
            state.waitingParticipants.length > 0 ? (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-signal animate-soft-pulse" />
            ) : null
          }
          title="Participants"
        />

        {/* In-Meeting Chat Button */}
        <ControlButton
          icon={<MessageSquare className="w-4 h-4 md:w-5 md:h-5" />}
          label="Chat"
          active={isChatOpen}
          onClick={onToggleChat}
          title="In-Meeting Chat"
          badge={
            state.unreadChatCount > 0 && !isChatOpen ? (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-signal text-ink text-[9px] font-semibold flex items-center justify-center">
                {state.unreadChatCount}
              </span>
            ) : null
          }
        />

        {/* Screen Share Toggle */}
        <ControlButton
          icon={state.isScreenSharing ? <MonitorOff className="w-4 h-4 md:w-5 md:h-5" /> : <MonitorUp className="w-4 h-4 md:w-5 md:h-5" />}
          label={state.isScreenSharing ? 'Sharing' : 'Share'}
          active={state.isScreenSharing}
          onClick={() => {
            if (state.isScreenSharing) {
              manager.stopScreenShare();
            } else {
              manager.startScreenShare();
            }
          }}
          title={state.isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        />

        {/* Local In-Meeting Recording */}
        <ControlButton
          icon={
            recordingState.isRecording ? (
              <Square className="w-4 h-4 md:w-5 md:h-5 fill-current" />
            ) : (
              <Circle className="w-4 h-4 md:w-5 md:h-5" />
            )
          }
          label={recordingState.isRecording ? 'Stop' : 'Record'}
          urgent={recordingState.isRecording}
          onClick={handleToggleRecording}
          title={recordingState.isRecording ? 'Stop Recording' : 'Record Meeting to Computer'}
        />

        {/* Small Group Breakouts */}
        <ControlButton
          icon={<DoorOpen className="w-4 h-4 md:w-5 md:h-5" />}
          label="Groups"
          active={isBreakoutRoomsOpen || state.isBreakoutOpen}
          onClick={onToggleBreakoutRooms}
          title="Small Group Discussions"
          badge={
            state.isBreakoutOpen ? (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-signal animate-soft-pulse" />
            ) : null
          }
        />

        {/* Reactions / Raise Hand Popover */}
        <div className="relative">
          <ControlButton
            icon={
              state.isHandRaised ? (
                <Hand className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <Smile className="w-4 h-4 md:w-5 md:h-5" />
              )
            }
            label={state.isHandRaised ? 'Hand' : 'React'}
            active={state.isHandRaised}
            onClick={() => {
              setIsReactionsMenuOpen((prev) => !prev);
              setIsAudioMenuOpen(false);
              setIsVideoMenuOpen(false);
              setIsSecurityMenuOpen(false);
            }}
            title="Reactions"
          />

          {isReactionsMenuOpen && (
            <div className="absolute bottom-16 -left-16 w-56 bg-glass border border-line rounded-panel shadow-float p-3 z-50 animate-rise space-y-2">
              {/* Quick Emojis Grid */}
              <div className="flex items-center justify-between px-1">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSelectReaction(emoji)}
                    className="text-lg p-1 rounded-control hover:bg-chalk/[0.08] transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Raise Hand Button */}
              <button
                onClick={handleToggleRaiseHand}
                className={`w-full py-2 px-3 rounded-control text-xs font-medium flex items-center justify-center space-x-2 transition border ${
                  state.isHandRaised
                    ? 'bg-signal/15 border-signal/40 text-signal hover:bg-signal/25'
                    : 'bg-chalk/[0.04] border-line text-chalk/80 hover:bg-chalk/[0.08] hover:text-chalk'
                }`}
              >
                <Hand className="w-3.5 h-3.5" />
                <span>{state.isHandRaised ? 'Lower hand' : 'Raise hand'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Whiteboard Toggle */}
        <ControlButton
          icon={<Edit3 className="w-4 h-4 md:w-5 md:h-5" />}
          label="Board"
          active={isWhiteboardOpen}
          onClick={onToggleWhiteboard}
          title="Whiteboard"
          className="hidden sm:flex"
        />

        {/* Share Files Toggle */}
        <ControlButton
          icon={<Share2 className="w-4 h-4 md:w-5 md:h-5" />}
          label="Files"
          active={isFileShareOpen}
          onClick={onToggleFileShare}
          title="Share Files"
          className="hidden sm:flex"
        />
      </div>

      {/* Right: Leave / End Meeting Button */}
      <div className="relative">
        {isHost ? (
          <div>
            <button
              onClick={() => setIsLeaveMenuOpen((prev) => !prev)}
              className="px-4 md:px-5 py-3 rounded-control bg-pulse/15 hover:bg-pulse/25 border border-pulse/40 text-pulse font-medium flex items-center space-x-2 transition-colors"
              title="End / Leave Meeting"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="text-xs font-medium">End</span>
            </button>

            {isLeaveMenuOpen && (
              <div className="absolute bottom-16 right-0 w-48 bg-glass border border-line rounded-panel shadow-float p-1.5 z-50 animate-rise space-y-0.5">
                <button
                  onClick={handleLeaveMeeting}
                  className="w-full text-left px-2.5 py-2 rounded-control text-xs font-medium text-pulse hover:bg-pulse/10 transition"
                >
                  End meeting for all
                </button>
                <button
                  onClick={handleLeaveMeeting}
                  className="w-full text-left px-2.5 py-2 rounded-control text-xs font-medium text-chalk/80 hover:bg-chalk/[0.06] hover:text-chalk transition"
                >
                  Leave meeting
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleLeaveMeeting}
            className="px-4 md:px-5 py-3 rounded-control bg-pulse/15 hover:bg-pulse/25 border border-pulse/40 text-pulse font-medium flex items-center space-x-2 transition-colors"
            title="Leave Meeting"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="text-xs font-medium">Leave</span>
          </button>
        )}
      </div>
    </div>
  );
};
