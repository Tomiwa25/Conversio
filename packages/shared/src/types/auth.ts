import { RoomRole } from './room.js';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'host' | 'user';
  avatarUrl?: string | null;
  createdAt: string;
}

export interface UserTokenPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface RegisterRequestDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface RoomTokenPayload {
  roomId: string;
  userId: string;
  name: string;
  role: RoomRole;
  iat?: number;
  exp?: number;
}

export interface JoinRoomRequestDto {
  name: string;
  userId?: string;
  passcode?: string;
}

export interface RoomAuthResponse {
  token: string;
  roomId: string;
  userId: string;
  role: RoomRole;
  expiresIn: number;
}

export interface EncryptedPayloadEnvelope {
  iv: string; // Base64-encoded 12-byte IV for AES-GCM
  ciphertext: string; // Base64-encoded encrypted data + 16-byte GCM authentication tag
  algorithm: 'AES-256-GCM';
  timestamp: number;
}


