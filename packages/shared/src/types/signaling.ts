import { BreakoutRoom, Participant, Room, RoomLockState } from './room.js';

export enum SignalingEvent {
  // Connection & Room Lifecycle
  JOIN_ROOM = 'signal:join_room',
  LEAVE_ROOM = 'signal:leave_room',
  ROOM_STATE = 'signal:room_state',
  PEER_JOINED = 'signal:peer_joined',
  PEER_LEFT = 'signal:peer_left',
  
  // WebRTC Audio/Video Media Negotiation (SRTP)
  OFFER = 'signal:offer',
  ANSWER = 'signal:answer',
  ICE_CANDIDATE = 'signal:ice_candidate',

  // Room Governance & Concurrency
  REQUEST_LOCK = 'signal:request_lock',
  ROOM_LOCK_UPDATE = 'signal:room_lock_update',

  // Real-time DataChannel fallback / broadcast
  WHITEBOARD_STROKE = 'signal:whiteboard_stroke',
  POINTER_MOVE = 'signal:pointer_move',

  // Collaboration: In-Meeting Chat & Reactions
  CHAT_MESSAGE = 'signal:chat_message',
  REACTION = 'signal:reaction',
  RAISE_HAND = 'signal:raise_hand',

  // Host Moderation Suite
  MUTE_PARTICIPANT = 'signal:mute_participant',
  REMOVE_PARTICIPANT = 'signal:remove_participant',

  // Virtual Waiting Room
  WAITING_ROOM_JOINED = 'signal:waiting_room_joined',
  WAITING_ROOM_UPDATE = 'signal:waiting_room_update',
  ADMIT_PARTICIPANT = 'signal:admit_participant',
  TOGGLE_WAITING_ROOM = 'signal:toggle_waiting_room',

  // Network Quality Monitoring
  NETWORK_QUALITY = 'signal:network_quality',

  // Local Recording & Audio Analysis
  RECORDING_STATUS = 'signal:recording_status',
  ACTIVE_SPEAKER = 'signal:active_speaker',

  // Breakout Rooms
  BREAKOUT_ROOMS_UPDATE = 'signal:breakout_rooms_update',
  BREAKOUT_BROADCAST = 'signal:breakout_broadcast',
  BREAKOUT_CLOSE = 'signal:breakout_close',

  // Status & Exceptions
  ERROR = 'signal:error',
}

export interface JoinRoomPayload {
  roomId: string;
  participant: Omit<Participant, 'joinedAt'>;
  token?: string;
}

export interface RoomStatePayload {
  room: Room;
  participants: Participant[];
}

export interface PeerJoinedPayload {
  participant: Participant;
}

export interface PeerLeftPayload {
  participantId: string;
}

export interface SdpPayload {
  roomId: string;
  targetPeerId: string;
  senderPeerId: string;
  description: {
    type: 'offer' | 'answer' | 'pranswer' | 'rollback';
    sdp: string;
  };
}

export interface IceCandidatePayload {
  roomId: string;
  targetPeerId: string;
  senderPeerId: string;
  candidate: {
    candidate: string;
    sdpMid: string | null;
    sdpMLineIndex: number | null;
    usernameFragment?: string | null;
  };
}

export interface RequestLockPayload {
  roomId: string;
  userId: string;
  isLocked: boolean;
  expectedVersion: number;
}

export interface RoomLockUpdatePayload {
  roomId: string;
  lockState: RoomLockState;
}

export interface SignalErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  targetId?: string; // 'everyone' or specific participant userId
  targetName?: string;
  text: string;
  timestamp: string;
  isPrivate: boolean;
}

export interface ReactionPayload {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  emoji: string;
  timestamp: string;
}

export interface RaiseHandPayload {
  roomId: string;
  senderId: string;
  senderName: string;
  isHandRaised: boolean;
}

export interface MuteParticipantPayload {
  roomId: string;
  requesterId: string;
  targetPeerId: string | 'all';
  muteAudio: boolean;
  muteVideo?: boolean;
}

export interface RemoveParticipantPayload {
  roomId: string;
  requesterId: string;
  targetPeerId: string;
  reason?: string;
}

export interface WaitingParticipant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface WaitingRoomUpdatePayload {
  roomId: string;
  waitingParticipants: WaitingParticipant[];
}

export interface AdmitParticipantPayload {
  roomId: string;
  requesterId: string;
  targetUserId: string;
  admit: boolean;
}

export interface ToggleWaitingRoomPayload {
  roomId: string;
  requesterId: string;
  enabled: boolean;
}

export interface NetworkQualityPayload {
  roomId: string;
  userId: string;
  quality: 'excellent' | 'fair' | 'poor';
}

export interface RecordingStatusPayload {
  roomId: string;
  isRecording: boolean;
  recorderName: string;
  timestamp: string;
}

export interface ActiveSpeakerPayload {
  roomId: string;
  speakerId: string;
  speakerName: string;
}

export interface BreakoutRoomsUpdatePayload {
  roomId: string;
  rooms: BreakoutRoom[];
  isOpen: boolean;
}

export interface BreakoutBroadcastPayload {
  roomId: string;
  message: string;
  senderName: string;
}

export interface BreakoutClosePayload {
  roomId: string;
  countdownSeconds: number;
}



