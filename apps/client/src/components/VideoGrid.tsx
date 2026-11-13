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
  isActiveSpeaker?: boolean;
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
  isActiveSpeaker,
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
      ? 'text-signal'
      : networkQuality === 'fair'
      ? 'text-chalk/50'
      : 'text-pulse';

  return (
    <div
      onClick={onClick}
      className={`relative bg-black border rounded-panel overflow-hidden flex items-center justify-center aspect-video group transition-all duration-300 ${
        isActiveSpeaker && !isMuted
          ? 'border-signal/50 shadow-[0_0_0_1px_rgb(var(--c-signal)/0.35),0_0_32px_-8px_rgb(var(--c-signal)/0.4)]'
          : isPinned
          ? 'border-chalk/25'
          : 'border-line'
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

      {/* Video Off Fallback Avatar.
          The stage is dark in both themes, so this is pinned to literal ink
          rather than bg-glass (which is white under light mode). */}
      {isVideoOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0d11]">
          <div className="w-14 h-14 rounded-panel bg-white/[0.06] border border-white/10 flex items-center justify-center text-lg font-medium text-white/70">
            {name.charAt(0).toUpperCase()}
          </div>
          <p className="mt-2.5 text-[11px] tracking-wide text-white/45">{name}</p>
        </div>
      )}

      {/* Floating Reactions Overlay */}
      <FloatingReactionOverlay reactions={reactions} />

      {/* Tile overlays sit on video, so they stay dark in both themes —
          pinned colours, not theme tokens. */}
      {/* Top Left: Active Speaker & Hand Raised Badges */}
      <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
        {isActiveSpeaker && !isMuted && (
          <div className="flex items-center space-x-1.5 bg-signal text-black px-2 py-0.5 rounded-control text-[10px] font-semibold tracking-[0.08em] uppercase">
            <span className="w-1 h-1 rounded-full bg-black animate-soft-pulse" />
            <span>Speaking</span>
          </div>
        )}
        {isHandRaised && (
          <div className="flex items-center space-x-1.5 bg-black/80 text-white px-2 py-0.5 rounded-control text-[10px] font-semibold tracking-[0.08em] uppercase border border-white/12 backdrop-blur-md">
            <Hand className="w-3 h-3" />
            <span>Hand raised</span>
          </div>
        )}
      </div>

      {/* Top Right: Network Signal & Mic Status */}
      <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5">
        {/* Network Quality Indicator */}
        <div
          className={`p-1 rounded-control bg-black/70 backdrop-blur-md border border-white/12 ${signalColor}`}
          title={`Network Quality: ${networkQuality.charAt(0).toUpperCase() + networkQuality.slice(1)}`}
        >
          <Signal className="w-3.5 h-3.5" />
        </div>

        {isMuted && (
          <div className="p-1 rounded-control bg-pulse/90 text-black backdrop-blur-md" title="Muted">
            <MicOff className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Bottom Left: Participant Name Badge */}
      <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-control text-[11px] font-medium text-white border border-white/12">
        {isHost && <span title="Meeting Host"><Crown className="w-3 h-3 text-signal shrink-0" /></span>}
        {isScreen && <span title="Shared Screen"><MonitorUp className="w-3 h-3 text-white/60 shrink-0" /></span>}
        <span className="truncate max-w-[130px]">
          {name} {isLocal ? '(You)' : ''}
        </span>
      </div>
    </div>
  );
};

export const VideoGrid: React.FC = () => {
  const { state, manager } = useWebRTC();
  const [viewMode, setViewMode] = useState<'gallery' | 'speaker'>('gallery');
  const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null);

  const currentBreakout = state.breakoutRooms.find((r) => r.id === state.currentBreakoutRoomId);
  const visibleRemotePeerEntries =
    state.currentBreakoutRoomId && currentBreakout
      ? Array.from(state.remoteStreams.entries()).filter(([peerId]) =>
          currentBreakout.participantIds.includes(peerId)
        )
      : Array.from(state.remoteStreams.entries());

  const totalTiles = 1 + (state.screenStream ? 1 : 0) + visibleRemotePeerEntries.length;

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

  const spotlightPeerId = pinnedPeerId
    ? pinnedPeerId
    : state.activeSpeakerId && state.remoteStreams.has(state.activeSpeakerId)
    ? state.activeSpeakerId
    : null;

  const isLocalActiveSpeaker =
    !pinnedPeerId && !state.screenStream && state.activeSpeakerId === state.currentUser?.id;

  return (
    <div className="flex-1 p-4 flex flex-col items-center justify-center overflow-hidden relative">
      {/* Breakout Room Indicator Pill */}
      {state.currentBreakoutRoomId && currentBreakout && (
        <div className="absolute top-4 left-4 z-20 flex items-center space-x-2.5 bg-glass border border-line text-chalk px-3.5 py-1.5 rounded-panel backdrop-blur-xl text-xs shadow-float">
          <div className="w-1.5 h-1.5 rounded-full bg-signal animate-soft-pulse" />
          <span className="text-muted">Small group</span>
          <strong className="font-medium text-chalk">{currentBreakout.name}</strong>
          <button
            onClick={() => manager.joinBreakoutRoom(null)}
            className="ml-2 px-2.5 py-1 rounded-control bg-chalk/[0.06] hover:bg-chalk/10 border border-line text-chalk font-medium transition text-[11px]"
          >
            Return to main room
          </button>
        </div>
      )}

      {/* Breakout Broadcast Announcement Banner */}
      {state.breakoutAnnouncement && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 max-w-lg bg-signal text-ink px-4 py-2.5 rounded-panel text-xs font-medium shadow-float animate-rise flex items-center space-x-2">
          <span>{state.breakoutAnnouncement}</span>
        </div>
      )}

      {/* Breakout Closing Countdown Banner */}
      {state.breakoutClosingCountdown !== null && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 max-w-lg bg-pulse text-ink px-4 py-2.5 rounded-panel text-xs font-medium shadow-float animate-rise flex items-center space-x-2">
          <span>Breakout rooms will close in {state.breakoutClosingCountdown} seconds. Returning to main meeting…</span>
        </div>
      )}

      {/* Top Bar: View Mode Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setViewMode(viewMode === 'gallery' ? 'speaker' : 'gallery')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-control bg-glass hover:bg-chalk/[0.08] text-chalk/80 border border-line text-[11px] font-medium backdrop-blur-xl transition shadow-float"
          title="Toggle Meeting View"
        >
          {viewMode === 'gallery' ? (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Speaker view</span>
            </>
          ) : (
            <>
              <Grid className="w-3.5 h-3.5" />
              <span>Gallery view</span>
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
              isActiveSpeaker={state.activeSpeakerId === state.currentUser?.id}
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
            {visibleRemotePeerEntries.map(([peerId, stream]) => {
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
                  isActiveSpeaker={state.activeSpeakerId === peerId}
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
            {spotlightPeerId && state.remoteStreams.has(spotlightPeerId) ? (
              <VideoTile
                stream={state.remoteStreams.get(spotlightPeerId)!}
                name={state.participants.find((p) => p.id === spotlightPeerId)?.name || 'Participant'}
                isLocal={false}
                networkQuality={state.networkQualities.get(spotlightPeerId) || 'excellent'}
                reactions={getReactionsForUser(spotlightPeerId)}
                isPinned={true}
                isActiveSpeaker={state.activeSpeakerId === spotlightPeerId}
              />
            ) : state.screenStream ? (
              <VideoTile
                stream={state.screenStream}
                name={`${state.currentUser?.name}'s Screen`}
                isLocal={true}
                isScreen={true}
                isPinned={true}
              />
            ) : isLocalActiveSpeaker ? (
              <VideoTile
                stream={state.localStream}
                name={state.currentUser?.name || 'You'}
                isLocal={true}
                isMuted={state.isAudioMuted}
                isVideoOff={state.isVideoMuted}
                isHost={state.currentUser?.role === 'host'}
                isHandRaised={state.isHandRaised}
                isActiveSpeaker={true}
                networkQuality={state.localNetworkQuality}
                reactions={getReactionsForUser(state.currentUser?.id || '')}
                isPinned={true}
              />
            ) : visibleRemotePeerEntries.length > 0 ? (
              <VideoTile
                stream={visibleRemotePeerEntries[0][1]}
                name={state.participants.find((p) => p.id === visibleRemotePeerEntries[0][0])?.name || 'Participant'}
                isLocal={false}
                networkQuality={state.networkQualities.get(visibleRemotePeerEntries[0][0]) || 'excellent'}
                reactions={getReactionsForUser(visibleRemotePeerEntries[0][0])}
                isPinned={true}
                isActiveSpeaker={state.activeSpeakerId === visibleRemotePeerEntries[0][0]}
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
                isActiveSpeaker={state.activeSpeakerId === state.currentUser?.id}
                reactions={getReactionsForUser(state.currentUser?.id || '')}
              />
            </div>

            {visibleRemotePeerEntries.map(([peerId, stream]) => {
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
                    isActiveSpeaker={state.activeSpeakerId === peerId}
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
