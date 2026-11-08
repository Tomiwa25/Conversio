import { RoomRole } from './room.js';

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

