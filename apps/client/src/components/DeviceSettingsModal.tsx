'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWebRTC } from '../context/webrtc.context';
import { X, Mic, Volume2, Camera, Check } from 'lucide-react';

export const DeviceSettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'audio' | 'video';
}> = ({ isOpen, onClose, defaultTab = 'audio' }) => {
  const { manager, state } = useWebRTC();
  const [activeTab, setActiveTab] = useState<'audio' | 'video'>(defaultTab);

  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);

  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isTestingSpeaker, setIsTestingSpeaker] = useState(false);

  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load hardware devices
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      manager.enumerateDevices().then((devices) => {
        setAudioInputs(devices.audioInputs);
        setVideoInputs(devices.videoInputs);
        setAudioOutputs(devices.audioOutputs);
      });
    }
  }, [isOpen, defaultTab, manager]);

  // Attach live preview video when on video tab
  useEffect(() => {
    if (isOpen && activeTab === 'video' && previewVideoRef.current && state.localStream) {
      previewVideoRef.current.srcObject = state.localStream;
    }
  }, [isOpen, activeTab, state.localStream]);

  // Audio level meter visualization
  useEffect(() => {
    if (!isOpen || activeTab !== 'audio' || !state.localStream) return;

    try {
      const audioTrack = state.localStream.getAudioTracks()[0];
      if (!audioTrack) return;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(state.localStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setAudioLevel(normalized);
        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (e) {
      console.warn('AudioContext meter setup failed:', e);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isOpen, activeTab, state.localStream]);

  if (!isOpen) return null;

  // Test speaker with pleasant chime
  const handleTestSpeaker = () => {
    try {
      setIsTestingSpeaker(true);
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);

      setTimeout(() => {
        setIsTestingSpeaker(false);
        ctx.close().catch(() => {});
      }, 600);
    } catch (e) {
      console.warn('Speaker test failed:', e);
      setIsTestingSpeaker(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Audio & Video Settings</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 px-6 pt-3 bg-slate-950/40 space-x-4">
          <button
            onClick={() => setActiveTab('audio')}
            className={`pb-2.5 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'audio'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Audio Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`pb-2.5 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'video'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Video Settings</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5">
          {activeTab === 'audio' ? (
            <div className="space-y-4">
              {/* Microphone Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Microphone Input
                </label>
                <select
                  value={state.selectedAudioInputId || ''}
                  onChange={(e) => manager.switchAudioInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  {audioInputs.length === 0 && <option value="">Default System Microphone</option>}
                  {audioInputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>

                {/* Input Volume Level Meter */}
                <div className="mt-2.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                    <span>Input Level</span>
                    <span>{state.isAudioMuted ? 'Muted' : `${audioLevel}%`}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-75 rounded-full"
                      style={{ width: `${state.isAudioMuted ? 0 : audioLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Speaker Output Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">Speaker Output</label>
                  <button
                    onClick={handleTestSpeaker}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1 transition"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{isTestingSpeaker ? 'Testing...' : 'Test Speaker'}</span>
                  </button>
                </div>
                <select
                  value={state.selectedAudioOutputId || ''}
                  onChange={(e) => manager.switchAudioOutput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  {audioOutputs.length === 0 && <option value="">Default System Speaker</option>}
                  {audioOutputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Speaker ${d.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Camera Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Camera Input
                </label>
                <select
                  value={state.selectedVideoInputId || ''}
                  onChange={(e) => manager.switchVideoInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  {videoInputs.length === 0 && <option value="">Default System Camera</option>}
                  {videoInputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Video Preview Box */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5">Camera Preview</label>
                <div className="w-full aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center relative">
                  {state.isVideoMuted ? (
                    <div className="text-center text-xs text-slate-500">
                      Camera is currently off
                    </div>
                  ) : (
                    <video
                      ref={previewVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover -scale-x-100"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
