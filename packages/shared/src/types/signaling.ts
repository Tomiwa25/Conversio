import { Participant, Room, RoomLockState } from './room.js';

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

