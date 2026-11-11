'use client';

import React, { useState } from 'react';
import { useWebRTC } from '../context/webrtc.context';
import {
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Crown,
  Hand,
  UserX,
  VolumeX,
  Check,
  UserCheck,
  Users,
  Copy,
  Signal,
} from 'lucide-react';

export const ParticipantsDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { manager, state } = useWebRTC();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isHost = state.currentUser?.role === 'host';
  const totalCount = state.participants.length + 1;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMuteAll = () => {
    if (confirm('Mute all participants? Current and future participants will be muted.')) {
      manager.muteParticipant('all', true);
    }
  };

  return (
    <div className="fixed top-0 right-0 h-[calc(100vh-5rem)] w-88 md:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-30 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">
            Participants ({totalCount})
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          aria-label="Close Participants"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
        {/* Waiting Room Section (Host Only) */}
        {isHost && state.waitingParticipants.length > 0 && (
          <div className="p-3 bg-amber-500/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-400 flex items-center space-x-1.5">
                <span>Waiting Room ({state.waitingParticipants.length})</span>
              </span>
              <button
                onClick={() => {
                  state.waitingParticipants.forEach((p) => manager.admitParticipant(p.id, true));
                }}
                className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition"
              >
                Admit All
              </button>
            </div>

            <div className="space-y-1.5">
              {state.waitingParticipants.map((guest) => (
                <div
                  key={guest.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800"
                >
                  <span className="text-xs font-medium text-white truncate max-w-[130px]">
                    {guest.name}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => manager.admitParticipant(guest.id, true)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium flex items-center space-x-1 transition"
                      title="Admit to Meeting"
                    >
                      <UserCheck className="w-3 h-3" />
                      <span>Admit</span>
                    </button>
                    <button
                      onClick={() => manager.admitParticipant(guest.id, false)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 text-[11px] font-medium transition"
                      title="Deny Entry"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active In-Meeting Participants List */}
        <div className="p-3 space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
            In Meeting ({totalCount})
          </div>

          {/* Local Participant (You) */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800/60">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center text-xs font-bold">
                {state.currentUser?.name?.charAt(0).toUpperCase() || 'Y'}
              </div>
              <div className="flex flex-col truncate">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-medium text-white truncate max-w-[140px]">
                    {state.currentUser?.name}
                  </span>
                  <span className="text-[10px] text-slate-400">(You)</span>
                  {state.currentUser?.role === 'host' && (
                    <span title="Meeting Host"><Crown className="w-3 h-3 text-amber-400 shrink-0" /></span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-slate-400">
              {state.isHandRaised && (
                <div className="p-1 rounded-md bg-amber-500/20 text-amber-400" title="Hand Raised">
                  <Hand className="w-3.5 h-3.5" />
                </div>
              )}
              {state.isAudioMuted ? (
                <MicOff className="w-4 h-4 text-rose-400" />
              ) : (
                <Mic className="w-4 h-4 text-emerald-400" />
              )}
              {state.isVideoMuted ? (
                <VideoOff className="w-4 h-4 text-rose-400" />
              ) : (
                <Video className="w-4 h-4 text-emerald-400" />
              )}
            </div>
          </div>

          {/* Remote Participants */}
          {state.participants.map((p) => {
            const quality = state.networkQualities.get(p.id) || 'excellent';
            return (
              <div
                key={p.id}
                className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/40 border border-transparent hover:border-slate-800/60 transition"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="text-xs font-medium text-white truncate max-w-[130px]">
                      {p.name}
                    </span>
                    {p.role === 'host' && (
                      <span title="Meeting Host"><Crown className="w-3 h-3 text-amber-400 shrink-0" /></span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {p.isHandRaised && (
                    <div className="p-1 rounded-md bg-amber-500/20 text-amber-400" title="Hand Raised">
                      <Hand className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Network Signal Bar */}
                  <div
                    title={`Connection: ${quality}`}
                    className={`flex items-center ${
                      quality === 'excellent'
                        ? 'text-emerald-400'
                        : quality === 'fair'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    <Signal className="w-3.5 h-3.5" />
                  </div>

                  {p.isAudioMuted ? (
                    <MicOff className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Mic className="w-4 h-4 text-slate-400" />
                  )}
                  {p.isVideoMuted ? (
                    <VideoOff className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Video className="w-4 h-4 text-slate-400" />
                  )}

                  {/* Host Moderation Controls (Hover Actions) */}
                  {isHost && (
                    <div className="flex items-center space-x-1 pl-1 border-l border-slate-800">
                      <button
                        onClick={() => manager.muteParticipant(p.id, true)}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition"
                        title="Mute Participant"
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${p.name} from this meeting?`)) {
                            manager.removeParticipant(p.id);
                          }
                        }}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition"
                        title="Remove Participant"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Host Actions */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between space-x-2">
        <button
          onClick={handleCopyLink}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Link Copied' : 'Invite Link'}</span>
        </button>

        {isHost && (
          <button
            onClick={handleMuteAll}
            className="flex-1 py-2 px-3 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Mute All</span>
          </button>
        )}
      </div>
    </div>
  );
};
