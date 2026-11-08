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
} from 'lucide-react';

export const RoomControls: React.FC<{
  onToggleWhiteboard: () => void;
  isWhiteboardOpen: boolean;
  onToggleFileShare: () => void;
  isFileShareOpen: boolean;
}> = ({ onToggleWhiteboard, isWhiteboardOpen, onToggleFileShare, isFileShareOpen }) => {
  const { manager, state } = useWebRTC();
  const [copied, setCopied] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  const isHost = state.currentUser?.role === 'host';

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
    }
  };

  return (
    <div className="h-20 bg-slate-900/95 border-t border-slate-800/80 px-6 flex items-center justify-between backdrop-blur-md">
      {/* Left: Meeting Info & Invite */}
      <div className="flex items-center space-x-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white truncate max-w-[180px]">
            {state.room?.title || 'Team Meeting'}
          </span>
          <span className="text-[11px] text-slate-400">
            {state.participants.length + 1} participant{state.participants.length === 0 ? '' : 's'}
          </span>
        </div>

        <button
          onClick={handleCopyLink}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center space-x-1.5 text-xs font-medium"
          title="Copy Invitation Link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="text-[11px]">{copied ? 'Link Copied' : 'Invite'}</span>
        </button>

        {/* Lock Status Pill */}
        {state.isLocked && (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Lock className="w-3 h-3" />
            <span>Meeting Locked</span>
          </span>
        )}
      </div>

      {/* Center: Main In-Call Controls */}
      <div className="flex items-center space-x-3">
        {/* Microphone Toggle */}
        <button
          onClick={() => manager.toggleAudio()}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition shadow-md ${
            state.isAudioMuted
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title={state.isAudioMuted ? 'Unmute' : 'Mute'}
        >
          {state.isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          <span className="text-[10px] mt-1 font-medium">{state.isAudioMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        {/* Camera Toggle */}
        <button
          onClick={() => manager.toggleVideo()}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition shadow-md ${
            state.isVideoMuted
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title={state.isVideoMuted ? 'Start Video' : 'Stop Video'}
        >
          {state.isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          <span className="text-[10px] mt-1 font-medium">{state.isVideoMuted ? 'Start' : 'Stop'}</span>
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
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition shadow-md ${
            state.isScreenSharing
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title={state.isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        >
          {state.isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
          <span className="text-[10px] mt-1 font-medium">{state.isScreenSharing ? 'Sharing' : 'Share'}</span>
        </button>

        {/* Whiteboard Toggle */}
        <button
          onClick={onToggleWhiteboard}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition shadow-md ${
            isWhiteboardOpen
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title="Whiteboard"
        >
          <Edit3 className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Board</span>
        </button>

        {/* Share Files Toggle */}
        <button
          onClick={onToggleFileShare}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition shadow-md ${
            isFileShareOpen
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title="Share Files"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Files</span>
        </button>

        {/* Host Security / Lock Button */}
        {isHost && (
          <button
            onClick={handleToggleLock}
            disabled={isLocking}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition shadow-md ${
              state.isLocked
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={state.isLocked ? 'Unlock Meeting (Allow New Joins)' : 'Lock Meeting (Block New Joins)'}
          >
            {state.isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            <span className="text-[10px] mt-1 font-medium">{state.isLocked ? 'Locked' : 'Lock'}</span>
          </button>
        )}
      </div>

      {/* Right: Leave Meeting Button */}
      <div>
        <button
          onClick={() => {
            manager.disconnect();
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          }}
          className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center space-x-2 transition shadow-lg shadow-rose-900/30"
          title="Leave Meeting"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="text-xs font-semibold">Leave</span>
        </button>
      </div>
    </div>
  );
};
