export type RoomRole = 'host' | 'co-host' | 'participant';

export interface Participant {
  id: string;
  name: string;
  role: RoomRole;
  joinedAt: string;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
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
}

export interface CreateRoomDto {
  title: string;
  hostId: string;
  maxParticipants?: number;
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

