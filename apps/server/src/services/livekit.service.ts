import { AccessToken } from 'livekit-server-sdk';
import { config } from '../config.js';

export interface GenerateLiveKitTokenParams {
  roomId: string;
  userId: string;
  name: string;
  role: 'host' | 'participant';
}

export class LiveKitService {
  /**
   * Generates a signed LiveKit Access Token JWT for video/audio room admission.
   * Grants canPublish, canSubscribe, canPublishData, and host-level administration grants.
   */
  public async generateToken(params: GenerateLiveKitTokenParams): Promise<string> {
    const { roomId, userId, name, role } = params;
    const isHost = role === 'host';

    const at = new AccessToken(config.livekitApiKey, config.livekitApiSecret, {
      identity: userId,
      name: name || 'Participant',
      ttl: '24h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: isHost,
      roomRecord: isHost,
    });

    return await at.toJwt();
  }
}

export const livekitService = new LiveKitService();
