'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useWebRTC } from '../context/webrtc.context';
import {
  Mic,
  MicOff,
  Crown,
  MonitorUp,
  Hand,
  Signal,
  Grid,
  Maximize2,
  Pin,
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
          className="text-4xl animate-bounce drop-shadow-xl transition-transform duration-700"
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

export const ParticipantTile: React.FC<{
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
      ? 'text-emerald-400'
      : networkQuality === 'fair'
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div
      onClick={onClick}
      className={`relative bg-[#1C1C1F] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center aspect-video group transition-all duration-300 select-none ${
        isActiveSpeaker && !isMuted
          ? 'border-2 border-[#22C55E] ring-2 ring-[#22C55E]/60 shadow-emerald-500/25 shadow-xl'
          : isPinned
          ? 'border-2 border-[#0E71EB] shadow-blue-500/20 shadow-xl'
          : 'border border-zinc-800/80 hover:border-zinc-700'
      }`}
    >
      {/* Video Stream Element */}
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal && !isScreen ? '-scale-x-100' : ''}`}
        />
      )}

      {/* Video Off Fallback Avatar (Zoom Sleek Gradient Avatar) */}
      {isVideoOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#1C1C1F] to-[#121214] text-zinc-400">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 border-2 border-zinc-600 flex items-center justify-center text-2xl font-bold text-white shadow-2xl">
            {name.charAt(0).toUpperCase()}
          </div>
          <p className="mt-3 text-xs font-semibold text-zinc-300">{name}</p>
        </div>
      )}

      {/* Floating Reaction Overlay */}
      <FloatingReactionOverlay reactions={reactions} />

      {/* Top Left: Active Speaker Speaking Pill & Hand Raised Badge */}
      <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 z-10">
        {isActiveSpeaker && !isMuted && (
          <div className="flex items-center space-x-1 bg-[#22C55E] text-zinc-950 px-2 py-0.5 rounded-md text-[11px] font-bold shadow-md animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-ping" />
            <span>Speaking</span>
          </div>
        )}
        {isHandRaised && (
          <div className="flex items-center space-x-1 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md text-[11px] font-bold shadow-md animate-pulse">
            <Hand className="w-3.5 h-3.5" />
            <span>Raised Hand</span>
          </div>
        )}
      </div>

      {/* Top Right: Network Quality Signal */}
      <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5 z-10">
        <div
          className={`p-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 ${signalColor}`}
          title={`Network Quality: ${networkQuality.charAt(0).toUpperCase() + networkQuality.slice(1)}`}
        >
          <Signal className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Bottom Left: Zoom-Style Participant Name Pill */}
      <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium text-white border border-white/10 z-10">
        <span title={isMuted ? "Muted" : "Microphone Active"}>
          {isMuted ? (
            <MicOff className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          ) : (
            <Mic className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
          )}
        </span>
        {isHost && (
          <span title="Meeting Host">
            <Crown className="w-3 h-3 text-amber-400 shrink-0" />
          </span>
        )}
        {isScreen && (
          <span title="Shared Screen">
            <MonitorUp className="w-3 h-3 text-blue-400 shrink-0" />
          </span>
        )}
        <span className="truncate max-w-[140px] text-zinc-100 font-semibold text-[11px]">
          {name} {isLocal ? '(You)' : ''}
        </span>
      </div>
    </div>
  );
};

export const ParticipantGrid: React.FC = () => {
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

  // Auto-calculates CSS grid columns (1 tile = 100%, 2 tiles = 2 cols, 3-4 tiles = 2x2, 5+ = 3x3)
  const getGridCols = () => {
    if (totalTiles <= 1) return 'grid-cols-1 max-w-4xl';
    if (totalTiles === 2) return 'grid-cols-1 md:grid-cols-2 max-w-5xl';
    if (totalTiles <= 4) return 'grid-cols-2 max-w-5xl';
    return 'grid-cols-2 md:grid-cols-3 max-w-6xl';
  };

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
    <div className="flex-1 w-full h-full p-4 flex flex-col items-center justify-center overflow-hidden relative bg-[#0F0F12]">
      {/* Breakout Room Indicator Banner */}
      {state.currentBreakoutRoomId && currentBreakout && (
        <div className="absolute top-4 left-4 z-20 flex items-center space-x-2.5 bg-zinc-900/90 border border-blue-500/40 text-blue-200 px-3.5 py-1.5 rounded-xl backdrop-blur-md text-xs font-medium shadow-lg">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span>Small Group: <strong>{currentBreakout.name}</strong></span>
          <button
            onClick={() => manager.joinBreakoutRoom(null)}
            className="ml-2 px-2.5 py-1 rounded-lg bg-[#0E71EB] hover:bg-[#005CE6] text-white font-medium transition text-xs shadow"
          >
            Return to Main Room
          </button>
        </div>
      )}

      {/* Breakout Broadcast Announcement */}
      {state.breakoutAnnouncement && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 max-w-lg bg-amber-500 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl backdrop-blur-md animate-bounce flex items-center space-x-2 border border-amber-300">
          <span>📢 {state.breakoutAnnouncement}</span>
        </div>
      )}

      {/* Breakout Closing Countdown */}
      {state.breakoutClosingCountdown !== null && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 max-w-lg bg-[#E02828] text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl backdrop-blur-md animate-pulse flex items-center space-x-2">
          <span>⏳ Breakout rooms closing in {state.breakoutClosingCountdown}s. Returning to main meeting...</span>
        </div>
      )}

      {/* View Mode Switcher Button (Top Right) */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setViewMode(viewMode === 'gallery' ? 'speaker' : 'gallery')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold backdrop-blur-md transition shadow-md"
          title="Toggle Zoom View"
        >
          {viewMode === 'gallery' ? (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-[#0E71EB]" />
              <span>Speaker View</span>
            </>
          ) : (
            <>
              <Grid className="w-3.5 h-3.5 text-[#0E71EB]" />
              <span>Gallery View</span>
            </>
          )}
        </button>
      </div>

      {viewMode === 'gallery' ? (
        /* Gallery View */
        <div className="w-full flex-1 flex items-center justify-center overflow-y-auto px-2">
          <div className={`grid ${getGridCols()} gap-4 w-full mx-auto transition-all duration-300`}>
            {/* Local Participant Tile */}
            <ParticipantTile
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
              <ParticipantTile
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
                <ParticipantTile
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
              <ParticipantTile
                stream={state.remoteStreams.get(spotlightPeerId)!}
                name={state.participants.find((p) => p.id === spotlightPeerId)?.name || 'Participant'}
                isLocal={false}
                networkQuality={state.networkQualities.get(spotlightPeerId) || 'excellent'}
                reactions={getReactionsForUser(spotlightPeerId)}
                isPinned={true}
                isActiveSpeaker={state.activeSpeakerId === spotlightPeerId}
              />
            ) : state.screenStream ? (
              <ParticipantTile
                stream={state.screenStream}
                name={`${state.currentUser?.name}'s Screen`}
                isLocal={true}
                isScreen={true}
                isPinned={true}
              />
            ) : isLocalActiveSpeaker ? (
              <ParticipantTile
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
              <ParticipantTile
                stream={visibleRemotePeerEntries[0][1]}
                name={state.participants.find((p) => p.id === visibleRemotePeerEntries[0][0])?.name || 'Participant'}
                isLocal={false}
                networkQuality={state.networkQualities.get(visibleRemotePeerEntries[0][0]) || 'excellent'}
                reactions={getReactionsForUser(visibleRemotePeerEntries[0][0])}
                isPinned={true}
                isActiveSpeaker={state.activeSpeakerId === visibleRemotePeerEntries[0][0]}
              />
            ) : (
              <ParticipantTile
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
            <div className="w-48 h-full shrink-0 cursor-pointer" onClick={() => setPinnedPeerId(null)}>
              <ParticipantTile
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
                  <ParticipantTile
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

export default ParticipantGrid;
