'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useWebRTC } from '../context/webrtc.context';
import {
  MicOff,
  Crown,
  MonitorUp,
  Hand,
  Signal,
  Grid,
  Maximize2,
} from 'lucide-react';

const FloatingReactionOverlay: React.FC<{
  reactions: Array<{ id: string; emoji: string }>;
}> = ({ reactions }) => {
  if (reactions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 flex items-center justify-center">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="text-4xl animate-bounce drop-shadow-lg transition-transform duration-700"
          style={{
            animation: 'bounce 1s infinite, fadeOut 3.5s forwards',
          }}
        >
          {r.emoji}
        </div>
      ))}
    </div>
  );
};

const VideoTile: React.FC<{
  stream: MediaStream | null;
  name: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isHost?: boolean;
  isScreen?: boolean;
  isHandRaised?: boolean;
  networkQuality?: 'excellent' | 'fair' | 'poor';
  reactions?: Array<{ id: string; emoji: string }>;
  onClick?: () => void;
  isPinned?: boolean;
}> = ({
  stream,
  name,
  isLocal,
  isMuted,
  isVideoOff,
  isHost,
  isScreen,
  isHandRaised,
  networkQuality = 'excellent',
  reactions = [],
  onClick,
  isPinned,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const signalColor =
    networkQuality === 'excellent'
      ? 'text-emerald-400'
      : networkQuality === 'fair'
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div
      onClick={onClick}
      className={`relative bg-slate-900 border rounded-2xl overflow-hidden shadow-lg flex items-center justify-center aspect-video group transition-all duration-200 ${
        isPinned ? 'border-blue-500 shadow-blue-500/20 shadow-xl' : 'border-slate-800'
      }`}
    >
      {/* Video Element */}
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal && !isScreen ? '-scale-x-100' : ''}`}
        />
      )}

      {/* Video Off Fallback Avatar */}
      {isVideoOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/95 text-slate-400">
          <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-white shadow">
            {name.charAt(0).toUpperCase()}
          </div>
          <p className="mt-2 text-xs font-medium text-slate-400">{name}</p>
        </div>
      )}

      {/* Floating Reactions Overlay */}
      <FloatingReactionOverlay reactions={reactions} />

      {/* Top Left: Hand Raised Badge */}
      {isHandRaised && (
        <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 bg-amber-500/90 text-slate-950 px-2.5 py-1 rounded-lg text-xs font-bold shadow-md animate-pulse">
          <Hand className="w-3.5 h-3.5" />
          <span>Hand Raised</span>
        </div>
      )}

      {/* Top Right: Network Signal & Mic Status */}
      <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5">
        {/* Network Quality Indicator */}
        <div
          className={`p-1 rounded-md bg-slate-950/70 backdrop-blur-sm ${signalColor}`}
          title={`Network Quality: ${networkQuality.charAt(0).toUpperCase() + networkQuality.slice(1)}`}
        >
          <Signal className="w-3.5 h-3.5" />
        </div>

        {isMuted && (
          <div className="p-1 rounded-md bg-rose-600/90 text-white backdrop-blur-sm" title="Muted">
            <MicOff className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Bottom Left: Participant Name Badge */}
      <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1.5 bg-slate-950/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium text-white border border-slate-800/80">
        {isHost && <span title="Meeting Host"><Crown className="w-3 h-3 text-amber-400 shrink-0" /></span>}
        {isScreen && <span title="Shared Screen"><MonitorUp className="w-3 h-3 text-blue-400 shrink-0" /></span>}
        <span className="truncate max-w-[130px]">
          {name} {isLocal ? '(You)' : ''}
        </span>
      </div>
    </div>
  );
};

export const VideoGrid: React.FC = () => {
  const { state } = useWebRTC();
  const [viewMode, setViewMode] = useState<'gallery' | 'speaker'>('gallery');
  const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null);

  const totalTiles =
    1 + (state.screenStream ? 1 : 0) + state.remoteStreams.size;

  const getGridCols = () => {
    if (totalTiles <= 1) return 'grid-cols-1 max-w-2xl';
    if (totalTiles === 2) return 'grid-cols-1 md:grid-cols-2 max-w-4xl';
    if (totalTiles <= 4) return 'grid-cols-2 max-w-5xl';
    return 'grid-cols-2 md:grid-cols-3 max-w-6xl';
  };

  // Filter reactions per participant
  const getReactionsForUser = (userId: string) => {
    return state.activeReactions
      .filter((r) => r.senderId === userId)
      .map((r) => ({ id: r.id, emoji: r.emoji }));
  };

  const remotePeerEntries = Array.from(state.remoteStreams.entries());

  return (
    <div className="flex-1 p-4 flex flex-col items-center justify-center overflow-hidden relative">
      {/* Top Bar: View Mode Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setViewMode(viewMode === 'gallery' ? 'speaker' : 'gallery')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium backdrop-blur-md transition shadow"
          title="Toggle Meeting View"
        >
          {viewMode === 'gallery' ? (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Speaker View</span>
            </>
          ) : (
            <>
              <Grid className="w-3.5 h-3.5" />
              <span>Gallery View</span>
            </>
          )}
        </button>
      </div>

      {viewMode === 'gallery' ? (
        /* Gallery View */
        <div className="w-full flex-1 flex items-center justify-center overflow-y-auto">
          <div className={`grid ${getGridCols()} gap-4 w-full mx-auto transition-all duration-300`}>
            {/* Local Participant Tile */}
            <VideoTile
              stream={state.localStream}
              name={state.currentUser?.name || 'You'}
              isLocal={true}
              isMuted={state.isAudioMuted}
              isVideoOff={state.isVideoMuted}
              isHost={state.currentUser?.role === 'host'}
              isHandRaised={state.isHandRaised}
              networkQuality={state.localNetworkQuality}
              reactions={getReactionsForUser(state.currentUser?.id || '')}
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
            {remotePeerEntries.map(([peerId, stream]) => {
              const participant = state.participants.find((p) => p.id === peerId);
              const quality = state.networkQualities.get(peerId) || 'excellent';
              return (
                <VideoTile
                  key={peerId}
                  stream={stream}
                  name={participant?.name || 'Participant'}
                  isLocal={false}
                  isMuted={participant?.isAudioMuted}
                  isVideoOff={participant?.isVideoMuted}
                  isHost={participant?.role === 'host'}
                  isHandRaised={participant?.isHandRaised}
                  networkQuality={quality}
                  reactions={getReactionsForUser(peerId)}
                />
              );
            })}
          </div>
        </div>
      ) : (
        /* Speaker View */
        <div className="w-full h-full flex flex-col justify-between max-w-5xl">
          {/* Main Focused Stage */}
          <div className="flex-1 flex items-center justify-center p-2">
            {pinnedPeerId && state.remoteStreams.has(pinnedPeerId) ? (
              <VideoTile
                stream={state.remoteStreams.get(pinnedPeerId)!}
                name={state.participants.find((p) => p.id === pinnedPeerId)?.name || 'Participant'}
                isLocal={false}
                networkQuality={state.networkQualities.get(pinnedPeerId) || 'excellent'}
                reactions={getReactionsForUser(pinnedPeerId)}
                isPinned={true}
              />
            ) : state.screenStream ? (
              <VideoTile
                stream={state.screenStream}
                name={`${state.currentUser?.name}'s Screen`}
                isLocal={true}
                isScreen={true}
                isPinned={true}
              />
            ) : remotePeerEntries.length > 0 ? (
              <VideoTile
                stream={remotePeerEntries[0][1]}
                name={state.participants.find((p) => p.id === remotePeerEntries[0][0])?.name || 'Participant'}
                isLocal={false}
                networkQuality={state.networkQualities.get(remotePeerEntries[0][0]) || 'excellent'}
                reactions={getReactionsForUser(remotePeerEntries[0][0])}
                isPinned={true}
              />
            ) : (
              <VideoTile
                stream={state.localStream}
                name={state.currentUser?.name || 'You'}
                isLocal={true}
                isMuted={state.isAudioMuted}
                isVideoOff={state.isVideoMuted}
                isHost={state.currentUser?.role === 'host'}
                isHandRaised={state.isHandRaised}
                networkQuality={state.localNetworkQuality}
                reactions={getReactionsForUser(state.currentUser?.id || '')}
                isPinned={true}
              />
            )}
          </div>

          {/* Filmstrip Thumbnails */}
          <div className="h-32 flex items-center space-x-3 overflow-x-auto px-2 pb-2">
            {/* Local thumbnail */}
            <div className="w-48 h-full shrink-0 cursor-pointer" onClick={() => setPinnedPeerId(null)}>
              <VideoTile
                stream={state.localStream}
                name={state.currentUser?.name || 'You'}
                isLocal={true}
                isMuted={state.isAudioMuted}
                isVideoOff={state.isVideoMuted}
                reactions={getReactionsForUser(state.currentUser?.id || '')}
              />
            </div>

            {remotePeerEntries.map(([peerId, stream]) => {
              const participant = state.participants.find((p) => p.id === peerId);
              return (
                <div
                  key={peerId}
                  className="w-48 h-full shrink-0 cursor-pointer"
                  onClick={() => setPinnedPeerId(peerId)}
                >
                  <VideoTile
                    stream={stream}
                    name={participant?.name || 'Participant'}
                    isLocal={false}
                    isMuted={participant?.isAudioMuted}
                    reactions={getReactionsForUser(peerId)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
