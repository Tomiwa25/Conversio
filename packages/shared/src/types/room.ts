export type RoomRole = 'host' | 'co-host' | 'participant';

export interface Participant {
  id: string;
  name: string;
  role: RoomRole;
  joinedAt: string;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isHandRaised?: boolean;
  networkQuality?: 'excellent' | 'fair' | 'poor';
}

export interface RoomLockState {
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: string;
  lockVersion: number;
}

export interface Room {
  id: string;
  title: string;
  hostId: string;
  createdAt: string;
  lockState: RoomLockState;
  maxParticipants: number;
  isActive: boolean;
  waitingRoomEnabled?: boolean;
  isPasscodeProtected?: boolean;
}

export interface BreakoutRoom {
  id: string;
  name: string;
  participantIds: string[];
}

export interface CreateRoomDto {
  title: string;
  hostId: string;
  maxParticipants?: number;
  passcode?: string;
}

export interface LockRoomDto {
  isLocked: boolean;
  userId: string;
  expectedVersion: number;
}

export interface RoomActionResponse {
  success: boolean;
  room?: Room;
  error?: string;
  versionMismatch?: boolean;
}

