import { Server as HttpServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import {
  ActiveSpeakerPayload,
  AdmitParticipantPayload,
  BreakoutBroadcastPayload,
  BreakoutClosePayload,
  BreakoutRoomsUpdatePayload,
  ChatMessage,
  IceCandidatePayload,
  JoinRoomPayload,
  MuteParticipantPayload,
  NetworkQualityPayload,
  Participant,
  RaiseHandPayload,
  ReactionPayload,
  RecordingStatusPayload,
  RemoveParticipantPayload,
  RoomLockState,
  RoomTokenPayload,
  SdpPayload,
  SignalingEvent,
  ToggleWaitingRoomPayload,
  WaitingParticipant,
  WaitingRoomUpdatePayload,
  WhiteboardPointer,
  WhiteboardStroke,
} from '@conversio/shared';
import { roomService } from '../services/room.service.js';
import { authService } from '../services/auth.service.js';
import { config } from '../config.js';

interface SocketSession {
  roomId: string;
  participant: Participant;
  tokenPayload?: RoomTokenPayload;
}

interface WaitingSession {
  socket: Socket;
  participant: WaitingParticipant;
  fullParticipant: Omit<Participant, 'joinedAt'>;
  tokenPayload?: RoomTokenPayload;
}

export class SignalingGateway {
  private io: Server | null = null;
  private socketSessions: Map<string, SocketSession> = new Map();
  private roomParticipants: Map<string, Map<string, Participant>> = new Map();
  private waitingRooms: Map<string, Map<string, WaitingSession>> = new Map();
  private roomWaitingState: Map<string, boolean> = new Map();

  public initialize(httpServer: HttpServer): Server {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    // Socket Authentication Middleware
    this.io.use((socket: Socket, next) => {
      const token = socket.handshake.auth?.token as string | undefined;
      if (token) {
        const payload = authService.verifyRoomToken(token);
        if (payload) {
          socket.data.tokenPayload = payload;
        }
      }
      next();
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

  private broadcastWaitingRoomUpdate(roomId: string): void {
    if (!this.io) return;
    const waitingMap = this.waitingRooms.get(roomId);
    const waitingParticipants: WaitingParticipant[] = waitingMap
      ? Array.from(waitingMap.values()).map((w) => w.participant)
      : [];

    const payload: WaitingRoomUpdatePayload = {
      roomId,
      waitingParticipants,
    };

    // Broadcast only to hosts in this room
    const currentParticipants = this.roomParticipants.get(roomId);
    if (currentParticipants) {
      for (const [sockId, p] of currentParticipants.entries()) {
        if (p.role === 'host' || p.role === 'co-host') {
          this.io.to(sockId).emit(SignalingEvent.WAITING_ROOM_UPDATE, payload);
        }
      }
    }
  }

  private completeJoin(
    socket: Socket,
    roomId: string,
    participant: Participant,
    tokenPayload?: RoomTokenPayload
  ): void {
    socket.join(roomId);
    socket.join(participant.id);
    this.socketSessions.set(socket.id, { roomId, participant, tokenPayload });

    if (!this.roomParticipants.has(roomId)) {
      this.roomParticipants.set(roomId, new Map());
    }
    const currentParticipants = this.roomParticipants.get(roomId)!;
    currentParticipants.set(socket.id, participant);

    // Notify joining client of full room state & existing peers
    roomService.getRoom(roomId).then((room) => {
      if (room) {
        socket.emit(SignalingEvent.ROOM_STATE, {
          room: {
            ...room,
            waitingRoomEnabled: this.roomWaitingState.get(roomId) ?? false,
          },
          participants: Array.from(currentParticipants.values()),
        });
      }
    });

    // Notify existing peers of the new participant
    socket.to(roomId).emit(SignalingEvent.PEER_JOINED, {
      participant,
    });

    // If host just joined, push waiting list if any exist
    if (participant.role === 'host') {
      this.broadcastWaitingRoomUpdate(roomId);
    }
  }

  private setupListeners(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      // 1. Join Room Handler with Token, Lock, & Virtual Waiting Room
      socket.on(SignalingEvent.JOIN_ROOM, async (payload: JoinRoomPayload) => {
        const { roomId, participant, token } = payload;
        const room = await roomService.getRoom(roomId);

        if (!room) {
          socket.emit(SignalingEvent.ERROR, {
            code: 'ROOM_NOT_FOUND',
            message: `Room ${roomId} does not exist.`,
          });
          return;
        }

        // Verify Cryptographic Token if provided
        const activeToken = token || (socket.handshake.auth?.token as string | undefined);
        let tokenPayload: RoomTokenPayload | undefined = socket.data.tokenPayload;

        if (activeToken && !tokenPayload) {
          tokenPayload = authService.verifyRoomToken(activeToken) || undefined;
        }

        // Cryptographic Token Verification & Cross-Room Replay Protection
        if (tokenPayload && tokenPayload.roomId !== roomId) {
          socket.emit(SignalingEvent.ERROR, {
            code: 'INVALID_TOKEN_ROOM',
            message: 'The provided admission token is not valid for this meeting.',
          });
          return;
        }

        const verifiedUserId = tokenPayload?.userId || participant.id;

        // Strict Role Elevation Protection:
        // Never trust raw participant.role from client. Role must come from signed JWT or match room.hostId.
        let verifiedRole: 'host' | 'co-host' | 'participant' = 'participant';
        if (tokenPayload?.role) {
          verifiedRole = tokenPayload.role;
        } else if (room.hostId === verifiedUserId) {
          verifiedRole = 'host';
        }

        // Room Lock Enforcement: prevent non-hosts from entering locked rooms
        if (room.lockState.isLocked && room.hostId !== verifiedUserId) {
          socket.emit(SignalingEvent.ERROR, {
            code: 'ROOM_LOCKED',
            message: 'This meeting is locked by the host. Entry denied.',
          });
          return;
        }

        const isWaitingRoomEnabled =
          this.roomWaitingState.get(roomId) ?? Boolean(room.waitingRoomEnabled);

        // Virtual Waiting Room Enforcement: non-hosts wait for host approval
        if (isWaitingRoomEnabled && room.hostId !== verifiedUserId && verifiedRole !== 'host') {
          if (!this.waitingRooms.has(roomId)) {
            this.waitingRooms.set(roomId, new Map());
          }
          const waitingMap = this.waitingRooms.get(roomId)!;
          const waitingParticipant: WaitingParticipant = {
            id: verifiedUserId,
            name: participant.name,
            joinedAt: new Date().toISOString(),
          };

          socket.join(verifiedUserId);
          waitingMap.set(verifiedUserId, {
            socket,
            participant: waitingParticipant,
            fullParticipant: participant,
            tokenPayload,
          });

          socket.emit(SignalingEvent.WAITING_ROOM_JOINED, {
            roomId,
            title: room.title,
            hostId: room.hostId,
          });

          this.broadcastWaitingRoomUpdate(roomId);
          return;
        }

        const fullParticipant: Participant = {
          ...participant,
          id: verifiedUserId,
          role: verifiedRole,
          joinedAt: new Date().toISOString(),
          isHandRaised: false,
        };

        this.completeJoin(socket, roomId, fullParticipant, tokenPayload);
      });

      // 2. Virtual Waiting Room Admittance
      socket.on(SignalingEvent.ADMIT_PARTICIPANT, async (payload: AdmitParticipantPayload) => {
        const session = this.socketSessions.get(socket.id);
        if (!session || (session.participant.role !== 'host' && session.participant.role !== 'co-host')) {
          return;
        }

        const waitingMap = this.waitingRooms.get(payload.roomId);
        if (!waitingMap) return;

        const targetWaiting = waitingMap.get(payload.targetUserId);
        if (!targetWaiting) return;

        waitingMap.delete(payload.targetUserId);
        this.broadcastWaitingRoomUpdate(payload.roomId);

        if (payload.admit) {
          const verifiedRole = targetWaiting.tokenPayload?.role || targetWaiting.fullParticipant.role || 'participant';
          const fullParticipant: Participant = {
            ...targetWaiting.fullParticipant,
            id: targetWaiting.participant.id,
            role: verifiedRole,
            joinedAt: new Date().toISOString(),
            isHandRaised: false,
          };

          targetWaiting.socket.emit(SignalingEvent.ADMIT_PARTICIPANT, {
            roomId: payload.roomId,
            admitted: true,
          });

          this.completeJoin(targetWaiting.socket, payload.roomId, fullParticipant, targetWaiting.tokenPayload);
        } else {
          targetWaiting.socket.emit(SignalingEvent.ERROR, {
            code: 'ADMISSION_DENIED',
            message: 'The host has denied admission to this meeting.',
          });
          targetWaiting.socket.disconnect(true);
        }
      });

      // 3. Toggle Virtual Waiting Room Mode
      socket.on(SignalingEvent.TOGGLE_WAITING_ROOM, (payload: ToggleWaitingRoomPayload) => {
        const session = this.socketSessions.get(socket.id);
        if (!session || session.participant.role !== 'host') return;

        this.roomWaitingState.set(payload.roomId, payload.enabled);
        this.io?.to(payload.roomId).emit(SignalingEvent.TOGGLE_WAITING_ROOM, payload);
      });

      // 4. In-Meeting Chat System (Public & Direct Messages)
      socket.on(SignalingEvent.CHAT_MESSAGE, (message: ChatMessage) => {
        const session = this.socketSessions.get(socket.id);
        if (!session || session.roomId !== message.roomId) return;

        // Ensure sender details cannot be spoofed
        const verifiedMessage: ChatMessage = {
          ...message,
          senderId: session.participant.id,
          senderName: session.participant.name,
          timestamp: new Date().toISOString(),
        };

        if (message.isPrivate && message.targetId && message.targetId !== 'everyone') {
          // Direct 1-on-1 private message: deliver to target user and sender
          this.io?.to(message.targetId).emit(SignalingEvent.CHAT_MESSAGE, verifiedMessage);
          socket.emit(SignalingEvent.CHAT_MESSAGE, verifiedMessage);
        } else {
          // Public message: broadcast to all participants in the room
          this.io?.to(session.roomId).emit(SignalingEvent.CHAT_MESSAGE, verifiedMessage);
        }
      });

      // 5. Floating Emoji Reactions
      socket.on(SignalingEvent.REACTION, (reaction: ReactionPayload) => {
        const session = this.socketSessions.get(socket.id);
        if (!session || session.roomId !== reaction.roomId) return;

        const verifiedReaction: ReactionPayload = {
          ...reaction,
          senderId: session.participant.id,
          senderName: session.participant.name,
          timestamp: new Date().toISOString(),
        };

        this.io?.to(session.roomId).emit(SignalingEvent.REACTION, verifiedReaction);
      });

      // 6. Raise / Lower Hand Toggle
      socket.on(SignalingEvent.RAISE_HAND, (payload: RaiseHandPayload) => {
        const session = this.socketSessions.get(socket.id);
        if (!session || session.roomId !== payload.roomId) return;

        session.participant.isHandRaised = payload.isHandRaised;

        const currentParticipants = this.roomParticipants.get(session.roomId);
        if (currentParticipants) {
          const p = currentParticipants.get(socket.id);
          if (p) p.isHandRaised = payload.isHandRaised;
        }

        this.io?.to(session.roomId).emit(SignalingEvent.RAISE_HAND, {
          roomId: session.roomId,
          senderId: session.participant.id,
          senderName: session.participant.name,
          isHandRaised: payload.isHandRaised,
        });
      });

      // 7. Host Moderation: Mute Participant / Mute All
      socket.on(SignalingEvent.MUTE_PARTICIPANT, (payload: MuteParticipantPayload) => {
        const session = this.socketSessions.get(socket.id);
        if (!session || (session.participant.role !== 'host' && session.participant.role !== 'co-host')) {
          return;
        }

        if (payload.targetPeerId === 'all') {
          // Mute everyone except the host
          socket.to(payload.roomId).emit(SignalingEvent.MUTE_PARTICIPANT, payload);
        } else {
          // Mute specific target participant
          this.io?.to(payload.targetPeerId).emit(SignalingEvent.MUTE_PARTICIPANT, payload);
        }
      });

      // 8. Host Moderation: Remove / Kick Participant
      socket.on(SignalingEvent.REMOVE_PARTICIPANT, (payload: RemoveParticipantPayload) => {
        const session = this.socketSessions.get(socket.id);
        if (!session || session.participant.role !== 'host') return;

        this.io?.to(payload.targetPeerId).emit(SignalingEvent.REMOVE_PARTICIPANT, {
          ...payload,
          reason: payload.reason || 'You were removed from the meeting by the host.',
        });
      });

      // 9. Real-Time Network Quality Metric Relay
      socket.on(SignalingEvent.NETWORK_QUALITY, (payload: NetworkQualityPayload) => {
        const session = this.socketSessions.get(socket.id);
        if (!session || session.roomId !== payload.roomId) return;

        session.participant.networkQuality = payload.quality;
        socket.to(payload.roomId).emit(SignalingEvent.NETWORK_QUALITY, payload);
      });

      // 9b. In-Meeting Local Recording Status Relay
      socket.on(SignalingEvent.RECORDING_STATUS, (payload: RecordingStatusPayload) => {
        const session = this.socketSessions.get(socket.id);
        if (!session || session.roomId !== payload.roomId) return;
        socket.to(payload.roomId).emit(SignalingEvent.RECORDING_STATUS, payload);
      });

      // 9c. Active Speaker Audio Detection Relay
      socket.on(SignalingEvent.ACTIVE_SPEAKER, (payload: ActiveSpeakerPayload) => {
        const session = this.socketSessions.get(socket.id);
        if (!session || session.roomId !== payload.roomId) return;
        socket.to(payload.roomId).emit(SignalingEvent.ACTIVE_SPEAKER, payload);
      });

      // 9d. Breakout Rooms Lifecycle Handlers
      socket.on(SignalingEvent.BREAKOUT_ROOMS_UPDATE, (payload: BreakoutRoomsUpdatePayload) => {
        const session = this.socketSessions.get(socket.id);
        if (!session || session.participant.role !== 'host') return;
        this.io?.to(payload.roomId).emit(SignalingEvent.BREAKOUT_ROOMS_UPDATE, payload);
      });

      socket.on(SignalingEvent.BREAKOUT_BROADCAST, (payload: BreakoutBroadcastPayload) => {
        const session = this.socketSessions.get(socket.id);
        if (!session || session.participant.role !== 'host') return;
        socket.to(payload.roomId).emit(SignalingEvent.BREAKOUT_BROADCAST, payload);
      });

      socket.on(SignalingEvent.BREAKOUT_CLOSE, (payload: BreakoutClosePayload) => {
        const session = this.socketSessions.get(socket.id);
        if (!session || session.participant.role !== 'host') return;
        this.io?.to(payload.roomId).emit(SignalingEvent.BREAKOUT_CLOSE, payload);
      });

      // 10. WebRTC Media Signaling (SDP Offer Relay)
      socket.on(SignalingEvent.OFFER, (payload: SdpPayload) => {
        const session = this.socketSessions.get(socket.id);
        if (!session || session.roomId !== payload.roomId) return;

        this.io?.to(payload.targetPeerId).emit(SignalingEvent.OFFER, {
          ...payload,
          senderPeerId: session.participant.id,
        });
      });

      // 11. WebRTC Media Signaling (SDP Answer Relay)
      socket.on(SignalingEvent.ANSWER, (payload: SdpPayload) => {
        const session = this.socketSessions.get(socket.id);
        if (!session || session.roomId !== payload.roomId) return;

        this.io?.to(payload.targetPeerId).emit(SignalingEvent.ANSWER, {
          ...payload,
          senderPeerId: session.participant.id,
        });
      });

      // 12. WebRTC ICE Candidate Relay (NAT/Firewall Traversal)
      socket.on(SignalingEvent.ICE_CANDIDATE, (payload: IceCandidatePayload) => {
        const session = this.socketSessions.get(socket.id);
        if (!session || session.roomId !== payload.roomId) return;

        this.io?.to(payload.targetPeerId).emit(SignalingEvent.ICE_CANDIDATE, {
          ...payload,
          senderPeerId: session.participant.id,
        });
      });

      // 13. Whiteboard Stroke Real-time Relay (Reliable vector fallback)
      socket.on(SignalingEvent.WHITEBOARD_STROKE, (stroke: WhiteboardStroke) => {
        const session = this.socketSessions.get(socket.id);
        if (!session) return;
        socket.to(session.roomId).emit(SignalingEvent.WHITEBOARD_STROKE, stroke);
      });

      // 14. Laser Pointer / Cursor Coordinate Relay (Unordered, low latency)
      socket.on(SignalingEvent.POINTER_MOVE, (pointer: WhiteboardPointer) => {
        const session = this.socketSessions.get(socket.id);
        if (!session) return;
        socket.to(session.roomId).emit(SignalingEvent.POINTER_MOVE, pointer);
      });

      // 15. Disconnection Cleanup
      socket.on('disconnect', () => {
        // Check if socket was in waiting room
        for (const [roomId, waitingMap] of this.waitingRooms.entries()) {
          for (const [userId, session] of waitingMap.entries()) {
            if (session.socket.id === socket.id) {
              waitingMap.delete(userId);
              this.broadcastWaitingRoomUpdate(roomId);
              break;
            }
          }
        }

        const session = this.socketSessions.get(socket.id);
        if (session) {
          const { roomId, participant } = session;
          const participantsMap = this.roomParticipants.get(roomId);
          if (participantsMap) {
            participantsMap.delete(socket.id);
            if (participantsMap.size === 0) {
              this.roomParticipants.delete(roomId);
              this.waitingRooms.delete(roomId);
              this.roomWaitingState.delete(roomId);
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
