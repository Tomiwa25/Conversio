'use client';

import React, { useEffect, useRef } from 'react';
import { useWebRTC } from '../context/webrtc.context';
import { MicOff, VideoOff, Crown, MonitorUp } from 'lucide-react';

const VideoTile: React.FC<{
  stream: MediaStream | null;
  name: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isHost?: boolean;
  isScreen?: boolean;
}> = ({ stream, name, isLocal, isMuted, isVideoOff, isHost, isScreen }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center aspect-video group">
      {/* Video Element */}
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Always mute local video playback to prevent audio feedback loops
          className={`w-full h-full object-cover ${isLocal && !isScreen ? '-scale-x-100' : ''}`}
        />
      )}

      {/* Video Off Fallback Avatar */}
      {isVideoOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/90 text-slate-400">
          <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-white shadow">
            {name.charAt(0).toUpperCase()}
          </div>
          <p className="mt-2 text-xs font-medium text-slate-400">{name}</p>
        </div>
      )}

      {/* Badges / Overlay */}
      <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1.5 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium text-white border border-slate-800">
        {isHost && <Crown className="w-3 h-3 text-amber-400" />}
        {isScreen && <MonitorUp className="w-3 h-3 text-blue-400" />}
        <span className="truncate max-w-[120px]">{name} {isLocal ? '(You)' : ''}</span>
      </div>

      <div className="absolute top-2.5 right-2.5 flex items-center space-x-1">
        {isMuted && (
          <div className="p-1 rounded-md bg-rose-600/80 text-white backdrop-blur-sm">
            <MicOff className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
};

export const VideoGrid: React.FC = () => {
  const { state } = useWebRTC();

  const totalTiles =
    1 + // Local tile
    (state.screenStream ? 1 : 0) +
    state.remoteStreams.size;

  // Grid layout helper
  const getGridCols = () => {
    if (totalTiles <= 1) return 'grid-cols-1 max-w-2xl';
    if (totalTiles === 2) return 'grid-cols-1 md:grid-cols-2 max-w-4xl';
    if (totalTiles <= 4) return 'grid-cols-2 max-w-5xl';
    return 'grid-cols-2 md:grid-cols-3 max-w-6xl';
  };

  return (
    <div className="flex-1 p-4 flex items-center justify-center overflow-y-auto">
      <div className={`grid ${getGridCols()} gap-4 w-full mx-auto transition-all duration-300`}>
        {/* Local Participant Tile */}
        <VideoTile
          stream={state.localStream}
          name={state.currentUser?.name || 'You'}
          isLocal={true}
          isMuted={state.isAudioMuted}
          isVideoOff={state.isVideoMuted}
          isHost={state.currentUser?.role === 'host'}
        />

        {/* Local Screen Share Tile */}
        {state.screenStream && (
          <VideoTile
            stream={state.screenStream}
            name={`${state.currentUser?.name}'s Screen`}
            isLocal={true}
            isScreen={true}
          />
        )}

        {/* Remote Participants Tiles */}
        {Array.from(state.remoteStreams.entries()).map(([peerId, stream]) => {
          const participant = state.participants.find((p) => p.id === peerId);
          return (
            <VideoTile
              key={peerId}
              stream={stream}
              name={participant?.name || 'Remote Peer'}
              isLocal={false}
              isMuted={participant?.isAudioMuted}
              isVideoOff={participant?.isVideoMuted}
              isHost={participant?.role === 'host'}
            />
          );
        })}
      </div>
    </div>
  );
};

