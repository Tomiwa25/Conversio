import jwt from 'jsonwebtoken';
import { RoomRole, RoomTokenPayload } from '@conversio/shared';
import { config } from '../config.js';

export class AuthService {
  private secret: string;

  constructor() {
    this.secret = config.jwtSecret;
  }

  public generateRoomToken(payload: {
    roomId: string;
    userId: string;
    name: string;
    role: RoomRole;
  }): string {
    return jwt.sign(
      {
        roomId: payload.roomId,
        userId: payload.userId,
        name: payload.name,
        role: payload.role,
      },
      this.secret,
      { expiresIn: '12h' }
    );
  }

  public verifyRoomToken(token: string): RoomTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as RoomTokenPayload;
      return decoded;
    } catch (err) {
      return null;
    }
  }
}

export const authService = new AuthService();

