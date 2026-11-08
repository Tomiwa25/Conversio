'use client';

import React, { useState } from 'react';
import { useWebRTC } from '../context/webrtc.context';
import { DeviceSettingsModal } from './DeviceSettingsModal';
import { Loader2, Settings, PhoneOff, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const VirtualWaitingRoom: React.FC<{
  title?: string;
}> = ({ title }) => {
  const { manager, state } = useWebRTC();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLeave = () => {
    manager.disconnect();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center space-y-6 animate-in zoom-in-95 duration-200">
        {/* Animated Badge */}
        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 bg-slate-900 rounded-full">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          </div>
        </div>

        {/* Meeting Information */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold tracking-wider text-blue-400 uppercase bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            Waiting Room
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {title || state.waitingRoomTitle || 'Team Meeting'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Please wait, the meeting host will let you in soon.
          </p>
        </div>

        {/* Self Information Card */}
        <div className="w-full bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
              {state.currentUser?.name?.charAt(0).toUpperCase() || 'G'}
            </div>
            <span className="font-medium text-white">{state.currentUser?.name || 'Guest'}</span>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Test Audio & Video</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex space-x-3 pt-2">
          <button
            onClick={handleLeave}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-2 transition"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Leave Meeting</span>
          </button>
        </div>
      </div>

      {/* Settings Modal while in waiting room */}
      <DeviceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
