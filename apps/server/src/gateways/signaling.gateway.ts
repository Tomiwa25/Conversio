import { Server as HttpServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import {
  IceCandidatePayload,
  JoinRoomPayload,
  Participant,
  RoomLockState,
  SdpPayload,
  SignalingEvent,
  WhiteboardPointer,
  WhiteboardStroke,
} from '@conversio/shared';
import { roomService } from '../services/room.service.js';
import { config } from '../config.js';

interface SocketSession {
  roomId: string;
  participant: Participant;
}

export class SignalingGateway {
  private io: Server | null = null;
  private socketSessions: Map<string, SocketSession> = new Map();
  private roomParticipants: Map<string, Map<string, Participant>> = new Map();

  public initialize(httpServer: HttpServer): Server {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.setupListeners();
    return this.io;
  }

  public broadcastLockUpdate(roomId: string, lockState: RoomLockState): void {
    if (!this.io) return;
    this.io.to(roomId).emit(SignalingEvent.ROOM_LOCK_UPDATE, {
      roomId,
      lockState,
    });
  }

  private setupListeners(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      // 1. Join Room Handler with Lock Verification
      socket.on(SignalingEvent.JOIN_ROOM, (payload: JoinRoomPayload) => {
        const { roomId, participant } = payload;
        const room = roomService.getRoom(roomId);

        if (!room) {
          socket.emit(SignalingEvent.ERROR, {
            code: 'ROOM_NOT_FOUND',
            message: `Room ${roomId} does not exist.`,
          });
          return;
        }

        // Room Lock Enforcement: prevent non-hosts from entering locked rooms
        if (room.lockState.isLocked && room.hostId !== participant.id) {
          socket.emit(SignalingEvent.ERROR, {
            code: 'ROOM_LOCKED',
            message: 'This room is currently locked by the host. Entry denied.',
          });
          return;
        }

        const fullParticipant: Participant = {
          ...participant,
          joinedAt: new Date().toISOString(),
        };

        // Join Socket.io room channel
        socket.join(roomId);
        this.socketSessions.set(socket.id, { roomId, participant: fullParticipant });

        if (!this.roomParticipants.has(roomId)) {
          this.roomParticipants.set(roomId, new Map());
        }
        const currentParticipants = this.roomParticipants.get(roomId)!;
        currentParticipants.set(socket.id, fullParticipant);

        // Notify joining client of full room state & existing peers
        socket.emit(SignalingEvent.ROOM_STATE, {
          room,
          participants: Array.from(currentParticipants.values()),
        });

        // Notify existing peers of the new participant
        socket.to(roomId).emit(SignalingEvent.PEER_JOINED, {
          participant: fullParticipant,
        });
      });

      // 2. WebRTC Media Signaling (SDP Offer Relay)
      socket.on(SignalingEvent.OFFER, (payload: SdpPayload) => {
        const session = this.socketSessions.get(socket.id);
        if (!session || session.roomId !== payload.roomId) return;

        // Forward SDP Offer to the designated peer socket
        socket.to(payload.targetPeerId).emit(SignalingEvent.OFFER, {
          ...payload,
          senderPeerId: socket.id,
        });
      });

      // 3. WebRTC Media Signaling (SDP Answer Relay)
      socket.on(SignalingEvent.ANSWER, (payload: SdpPayload) => {
        const session = this.socketSessions.get(socket.id);
        if (!session || session.roomId !== payload.roomId) return;

        // Forward SDP Answer to the designated peer socket
        socket.to(payload.targetPeerId).emit(SignalingEvent.ANSWER, {
          ...payload,
          senderPeerId: socket.id,
        });
      });

      // 4. WebRTC ICE Candidate Relay (SRTP NAT/Firewall Traversal)
      socket.on(SignalingEvent.ICE_CANDIDATE, (payload: IceCandidatePayload) => {
        const session = this.socketSessions.get(socket.id);
        if (!session || session.roomId !== payload.roomId) return;

        socket.to(payload.targetPeerId).emit(SignalingEvent.ICE_CANDIDATE, {
          ...payload,
          senderPeerId: socket.id,
        });
      });

      // 5. Whiteboard Stroke Real-time Relay (Reliable vector fallback)
      socket.on(SignalingEvent.WHITEBOARD_STROKE, (stroke: WhiteboardStroke) => {
        const session = this.socketSessions.get(socket.id);
        if (!session) return;
        socket.to(session.roomId).emit(SignalingEvent.WHITEBOARD_STROKE, stroke);
      });

      // 6. Laser Pointer / Cursor Coordinate Relay (Unordered, low latency)
      socket.on(SignalingEvent.POINTER_MOVE, (pointer: WhiteboardPointer) => {
        const session = this.socketSessions.get(socket.id);
        if (!session) return;
        socket.to(session.roomId).emit(SignalingEvent.POINTER_MOVE, pointer);
      });

      // 7. Disconnection Cleanup
      socket.on('disconnect', () => {
        const session = this.socketSessions.get(socket.id);
        if (session) {
          const { roomId, participant } = session;
          const participantsMap = this.roomParticipants.get(roomId);
          if (participantsMap) {
            participantsMap.delete(socket.id);
            if (participantsMap.size === 0) {
              this.roomParticipants.delete(roomId);
            }
          }
          this.socketSessions.delete(socket.id);

          // Broadcast peer departure
          socket.to(roomId).emit(SignalingEvent.PEER_LEFT, {
            participantId: participant.id,
          });
        }
      });
    });
  }
}

export const signalingGateway = new SignalingGateway();

