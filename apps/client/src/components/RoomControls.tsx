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
   * Optimistic Concurrency Control (OCC) Room Lock Toggle
   */
  const handleToggleLock = async () => {
    if (!state.roomId || !state.currentUser) return;
    setIsLocking(true);

    try {
      const res = await fetch(`http://localhost:4000/api/rooms/${state.roomId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isLocked: !state.isLocked,
          userId: state.currentUser.id,
          expectedVersion: state.lockVersion,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(`Lock action failed: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Failed to update room lock:', err);
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <div className="h-20 bg-slate-900/90 border-t border-slate-800/80 px-6 flex items-center justify-between backdrop-blur-md">
      {/* Room Details & Link */}
      <div className="flex items-center space-x-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white truncate max-w-[180px]">
            {state.room?.title || 'Conversio Call'}
          </span>
          <span className="text-[11px] text-slate-400">
            {state.participants.length + 1} participant{state.participants.length === 0 ? '' : 's'}
          </span>
        </div>

        <button
          onClick={handleCopyLink}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center space-x-1 text-xs"
          title="Copy Room Link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="text-[11px]">{copied ? 'Copied' : 'Invite'}</span>
        </button>

        {/* Lock State Pill */}
        {state.isLocked && (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Lock className="w-3 h-3" />
            <span>Locked</span>
          </span>
        )}
      </div>

      {/* Main Conference Controls */}
      <div className="flex items-center space-x-3">
        {/* Audio Toggle */}
        <button
          onClick={() => manager.toggleAudio()}
          className={`p-3.5 rounded-2xl transition shadow-md ${
            state.isAudioMuted
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title={state.isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {state.isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={() => manager.toggleVideo()}
          className={`p-3.5 rounded-2xl transition shadow-md ${
            state.isVideoMuted
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title={state.isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {state.isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
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
          className={`p-3.5 rounded-2xl transition shadow-md ${
            state.isScreenSharing
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title={state.isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          {state.isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
        </button>

        {/* Whiteboard Toggle */}
        <button
          onClick={onToggleWhiteboard}
          className={`p-3.5 rounded-2xl transition shadow-md ${
            isWhiteboardOpen
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title="Collaborative Whiteboard"
        >
          <Edit3 className="w-5 h-5" />
        </button>

        {/* File Sharing Drawer Toggle */}
        <button
          onClick={onToggleFileShare}
          className={`p-3.5 rounded-2xl transition shadow-md ${
            isFileShareOpen
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title="Direct Peer File Sharing"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* Host Room Lock Control (OCC Version Check) */}
        {isHost && (
          <button
            onClick={handleToggleLock}
            disabled={isLocking}
            className={`p-3.5 rounded-2xl transition shadow-md ${
              state.isLocked
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={state.isLocked ? 'Unlock Room (Allow New Joins)' : 'Lock Room (Block New Joins)'}
          >
            {state.isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Disconnect Call */}
      <div>
        <button
          onClick={() => {
            manager.disconnect();
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          }}
          className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center space-x-2 transition shadow-lg shadow-rose-900/30"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="text-xs">Leave</span>
        </button>
      </div>
    </div>
  );
};

