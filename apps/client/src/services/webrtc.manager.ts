import { io, Socket } from 'socket.io-client';
import {
  AdmitParticipantPayload,
  ChatMessage,
  IceCandidatePayload,
  JoinRoomPayload,
  MuteParticipantPayload,
  NetworkQualityPayload,
  Participant,
  RaiseHandPayload,
  ReactionPayload,
  RemoveParticipantPayload,
  Room,
  RoomLockState,
  SdpPayload,
  SignalingEvent,
  ToggleWaitingRoomPayload,
  WaitingParticipant,
  WaitingRoomUpdatePayload,
  WhiteboardPointer,
  WhiteboardSyncPayload,
} from '@conversio/shared';
import { CryptoUtils } from '../utils/crypto.utils';

export interface WebRTCState {
  roomId: string | null;
  room: Room | null;
  currentUser: Participant | null;
  participants: Participant[];
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isLocked: boolean;
  lockVersion: number;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  errorMessage: string | null;
  authToken: string | null;
  encryptionKey: CryptoKey | null;

  // Zoom-Style Collaboration State
  chatMessages: ChatMessage[];
  unreadChatCount: number;
  activeReactions: Array<{ id: string; senderId: string; senderName: string; emoji: string; timestamp: number }>;
  isHandRaised: boolean;
  networkQualities: Map<string, 'excellent' | 'fair' | 'poor'>;
  localNetworkQuality: 'excellent' | 'fair' | 'poor';
  isWaitingRoom: boolean;
  waitingRoomTitle: string | null;
  waitingParticipants: WaitingParticipant[];
  isRemovedByHost: boolean;
  hostMutedNotification: boolean;

  // Hardware Device Selection
  selectedAudioInputId: string | null;
  selectedVideoInputId: string | null;
  selectedAudioOutputId: string | null;
}

export type StateListener = (state: WebRTCState) => void;
export type WhiteboardListener = (payload: WhiteboardSyncPayload) => void;
export type PointerListener = (pointer: WhiteboardPointer) => void;
export type FileChunkListener = (chunk: {
  fileId: string;
  name: string;
  size: number;
  type: string;
  chunkIndex: number;
  totalChunks: number;
  data: ArrayBuffer;
  iv?: string;
  isEncrypted?: boolean;
}) => void;

const ICE_SERVERS: RTCIceServer[] = [
  { urls: process.env.NEXT_PUBLIC_STUN_SERVER_1 || 'stun:stun.l.google.com:19302' },
  { urls: process.env.NEXT_PUBLIC_STUN_SERVER_2 || 'stun:stun1.l.google.com:19302' },
  ...(process.env.NEXT_PUBLIC_TURN_SERVER_URL
    ? [
        {
          urls: process.env.NEXT_PUBLIC_TURN_SERVER_URL,
          username: process.env.NEXT_PUBLIC_TURN_USERNAME,
          credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
        },
      ]
    : []),
];

export class WebRTCConnectionManager {
  private socket: Socket | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private pendingIceCandidates: Map<string, RTCIceCandidateInit[]> = new Map();
  private makingOffer: Map<string, boolean> = new Map();
  private ignoreOffer: Map<string, boolean> = new Map();
  private dataChannels: Map<
    string,
    {
      whiteboard: RTCDataChannel;
      pointer: RTCDataChannel;
      file: RTCDataChannel;
    }
  > = new Map();

  private statsInterval: ReturnType<typeof setInterval> | null = null;
  private stateListeners: Set<StateListener> = new Set();
  private whiteboardListeners: Set<WhiteboardListener> = new Set();
  private pointerListeners: Set<PointerListener> = new Set();
  private fileListeners: Set<FileChunkListener> = new Set();

  private state: WebRTCState = {
    roomId: null,
    room: null,
    currentUser: null,
    participants: [],
    localStream: null,
    screenStream: null,
    remoteStreams: new Map(),
    isAudioMuted: false,
    isVideoMuted: false,
    isScreenSharing: false,
    isLocked: false,
    lockVersion: 1,
    connectionStatus: 'disconnected',
    errorMessage: null,
    authToken: null,
    encryptionKey: null,

    chatMessages: [],
    unreadChatCount: 0,
    activeReactions: [],
    isHandRaised: false,
    networkQualities: new Map(),
    localNetworkQuality: 'excellent',
    isWaitingRoom: false,
    waitingRoomTitle: null,
    waitingParticipants: [],
    isRemovedByHost: false,
    hostMutedNotification: false,

    selectedAudioInputId: null,
    selectedVideoInputId: null,
    selectedAudioOutputId: null,
  };

  constructor(
    private serverUrl: string = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'
  ) {}

  public getState(): WebRTCState {
    return { ...this.state };
  }

  public setEncryptionKey(key: CryptoKey | null): void {
    this.updateState({ encryptionKey: key });
  }

  public subscribe(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.getState());
    return () => this.stateListeners.delete(listener);
  }

  public onWhiteboard(listener: WhiteboardListener): () => void {
    this.whiteboardListeners.add(listener);
    return () => this.whiteboardListeners.delete(listener);
  }

  public onPointer(listener: PointerListener): () => void {
    this.pointerListeners.add(listener);
    return () => this.pointerListeners.delete(listener);
  }

  public onFileChunk(listener: FileChunkListener): () => void {
    this.fileListeners.add(listener);
    return () => this.fileListeners.delete(listener);
  }

  private updateState(partial: Partial<WebRTCState>): void {
    this.state = { ...this.state, ...partial };
    this.stateListeners.forEach((listener) => listener(this.getState()));
  }

  /**
   * Acquire local camera and microphone stream
   */
  public async initializeMedia(
    video = true,
    audio = true,
    audioDeviceId?: string,
    videoDeviceId?: string
  ): Promise<MediaStream> {
    try {
      const audioConstraints: boolean | MediaTrackConstraints = audio
        ? {
            echoCancellation: true,
            noiseSuppression: true,
            ...(audioDeviceId ? { deviceId: { exact: audioDeviceId } } : {}),
          }
        : false;

      const videoConstraints: boolean | MediaTrackConstraints = video
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            ...(videoDeviceId ? { deviceId: { exact: videoDeviceId } } : {}),
          }
        : false;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints,
      });

      this.updateState({
        localStream: stream,
        isAudioMuted: !audio,
        isVideoMuted: !video,
        selectedAudioInputId: audioDeviceId || this.state.selectedAudioInputId,
        selectedVideoInputId: videoDeviceId || this.state.selectedVideoInputId,
      });

      return stream;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Media device access denied';
      this.updateState({ errorMessage: errorMsg });
      throw err;
    }
  }

  /**
   * Connect to signaling server and join room with optional cryptographic token
   */
  public async joinRoom(
    roomId: string,
    participant: Omit<Participant, 'joinedAt'>,
    token?: string
  ): Promise<void> {
    this.updateState({
      connectionStatus: 'connecting',
      roomId,
      currentUser: participant as Participant,
      authToken: token || null,
      isRemovedByHost: false,
    });

    if (!this.state.localStream) {
      try {
        await this.initializeMedia(true, true);
      } catch (e) {
        console.warn('Proceeding without camera/microphone access:', e);
      }
    }

    this.socket = io(this.serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.setupSignalingHandlers(roomId, participant, token);
    this.startNetworkQualityMonitoring();
  }

  private setupSignalingHandlers(
    roomId: string,
    participant: Omit<Participant, 'joinedAt'>,
    token?: string
  ): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      const payload: JoinRoomPayload = { roomId, participant, token };
      this.socket?.emit(SignalingEvent.JOIN_ROOM, payload);
    });

    // Virtual Waiting Room Placement
    this.socket.on(SignalingEvent.WAITING_ROOM_JOINED, (payload: { roomId: string; title: string }) => {
      this.updateState({
        isWaitingRoom: true,
        waitingRoomTitle: payload.title || 'Meeting',
        connectionStatus: 'connected',
      });
    });

    // Virtual Waiting Room Admittance
    this.socket.on(SignalingEvent.ADMIT_PARTICIPANT, () => {
      this.updateState({
        isWaitingRoom: false,
      });
    });

    // Virtual Waiting Room Participant Update (for Host)
    this.socket.on(SignalingEvent.WAITING_ROOM_UPDATE, (payload: WaitingRoomUpdatePayload) => {
      this.updateState({
        waitingParticipants: payload.waitingParticipants,
      });
    });

    // Room initial state snapshot
    this.socket.on(SignalingEvent.ROOM_STATE, async (payload: { room: Room; participants: Participant[] }) => {
      this.updateState({
        room: payload.room,
        participants: payload.participants,
        isLocked: payload.room.lockState.isLocked,
        lockVersion: payload.room.lockState.lockVersion,
        connectionStatus: 'connected',
        isWaitingRoom: false,
        errorMessage: null,
      });

      // For existing peers in the room, initiate WebRTC Offer
      for (const peer of payload.participants) {
        if (peer.id !== this.state.currentUser?.id) {
          await this.createPeerConnection(peer.id, true);
        }
      }
    });

    // New peer joined after us
    this.socket.on(SignalingEvent.PEER_JOINED, async (payload: { participant: Participant }) => {
      const updated = [...this.state.participants.filter((p) => p.id !== payload.participant.id), payload.participant];
      this.updateState({ participants: updated });
    });

    // Peer departed
    this.socket.on(SignalingEvent.PEER_LEFT, (payload: { participantId: string }) => {
      this.cleanupPeer(payload.participantId);
      const updated = this.state.participants.filter((p) => p.id !== payload.participantId);
      const newRemoteStreams = new Map(this.state.remoteStreams);
      newRemoteStreams.delete(payload.participantId);
      const newQualities = new Map(this.state.networkQualities);
      newQualities.delete(payload.participantId);
      this.updateState({
        participants: updated,
        remoteStreams: newRemoteStreams,
        networkQualities: newQualities,
      });
    });

    // WebRTC Offer received with W3C Perfect Negotiation
    this.socket.on(SignalingEvent.OFFER, async (payload: SdpPayload) => {
      const peerId = payload.senderPeerId;
      const pc = await this.getOrCreatePeerConnection(peerId, false);

      const isPolite = (this.state.currentUser?.id || '') < peerId;
      const isOfferCollision =
        payload.description.type === 'offer' &&
        (Boolean(this.makingOffer.get(peerId)) || pc.signalingState !== 'stable');

      this.ignoreOffer.set(peerId, !isPolite && isOfferCollision);
      if (this.ignoreOffer.get(peerId)) {
        console.warn(`[WebRTC] Glare detected. Impolite peer ignoring colliding offer from ${peerId}`);
        return;
      }

      if (isOfferCollision) {
        await pc.setLocalDescription({ type: 'rollback' });
      }

      await pc.setRemoteDescription(new RTCSessionDescription(payload.description));
      await this.flushPendingCandidates(peerId, pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.socket?.emit(SignalingEvent.ANSWER, {
        roomId: payload.roomId,
        targetPeerId: peerId,
        senderPeerId: this.state.currentUser?.id || this.socket.id,
        description: answer,
      });
    });

    // WebRTC Answer received
    this.socket.on(SignalingEvent.ANSWER, async (payload: SdpPayload) => {
      const peerId = payload.senderPeerId;
      const pc = this.peerConnections.get(peerId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.description));
        await this.flushPendingCandidates(peerId, pc);
      }
    });

    // WebRTC ICE Candidate received with Candidate Queueing
    this.socket.on(SignalingEvent.ICE_CANDIDATE, async (payload: IceCandidatePayload) => {
      const peerId = payload.senderPeerId;
      const pc = this.peerConnections.get(peerId);

      if (!pc || !pc.remoteDescription) {
        const queue = this.pendingIceCandidates.get(peerId) || [];
        queue.push(payload.candidate);
        this.pendingIceCandidates.set(peerId, queue);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (err) {
        console.error(`[WebRTC] Failed to add ICE candidate from ${peerId}:`, err);
      }
    });

    // In-Meeting Chat Received
    this.socket.on(SignalingEvent.CHAT_MESSAGE, (message: ChatMessage) => {
      this.updateState({
        chatMessages: [...this.state.chatMessages, message],
        unreadChatCount: this.state.unreadChatCount + 1,
      });
    });

    // Floating Reaction Received
    this.socket.on(SignalingEvent.REACTION, (reaction: ReactionPayload) => {
      const item = {
        id: reaction.id,
        senderId: reaction.senderId,
        senderName: reaction.senderName,
        emoji: reaction.emoji,
        timestamp: Date.now(),
      };
      this.updateState({
        activeReactions: [...this.state.activeReactions, item],
      });

      // Automatically expire reaction visual after 3.5 seconds
      setTimeout(() => {
        this.updateState({
          activeReactions: this.state.activeReactions.filter((r) => r.id !== item.id),
        });
      }, 3500);
    });

    // Raise Hand Received
    this.socket.on(SignalingEvent.RAISE_HAND, (payload: RaiseHandPayload) => {
      const updated = this.state.participants.map((p) =>
        p.id === payload.senderId ? { ...p, isHandRaised: payload.isHandRaised } : p
      );
      const isLocal = payload.senderId === this.state.currentUser?.id;
      this.updateState({
        participants: updated,
        isHandRaised: isLocal ? payload.isHandRaised : this.state.isHandRaised,
      });
    });

    // Host Moderation: Mute Received
    this.socket.on(SignalingEvent.MUTE_PARTICIPANT, (payload: MuteParticipantPayload) => {
      const isMe = payload.targetPeerId === 'all' || payload.targetPeerId === this.state.currentUser?.id;
      if (isMe && payload.muteAudio) {
        this.toggleAudio(true); // Force mute
        this.updateState({ hostMutedNotification: true });
      }
    });

    // Host Moderation: Remove Received
    this.socket.on(SignalingEvent.REMOVE_PARTICIPANT, (payload: RemoveParticipantPayload) => {
      if (payload.targetPeerId === this.state.currentUser?.id) {
        this.disconnect();
        this.updateState({
          isRemovedByHost: true,
          errorMessage: payload.reason || 'You were removed from the meeting by the host.',
        });
      }
    });

    // Remote Network Quality Metric
    this.socket.on(SignalingEvent.NETWORK_QUALITY, (payload: NetworkQualityPayload) => {
      const updated = new Map(this.state.networkQualities);
      updated.set(payload.userId, payload.quality);
      this.updateState({ networkQualities: updated });
    });

    // Room Lock Update Broadcast
    this.socket.on(SignalingEvent.ROOM_LOCK_UPDATE, (payload: { lockState: RoomLockState }) => {
      this.updateState({
        isLocked: payload.lockState.isLocked,
        lockVersion: payload.lockState.lockVersion,
      });
    });

    // Whiteboard stroke fallback
    this.socket.on(SignalingEvent.WHITEBOARD_STROKE, (payload: WhiteboardSyncPayload) => {
      this.whiteboardListeners.forEach((l) => l(payload));
    });

    // Pointer move fallback
    this.socket.on(SignalingEvent.POINTER_MOVE, (pointer: WhiteboardPointer) => {
      this.pointerListeners.forEach((l) => l(pointer));
    });

    // Signaling error / Access denied
    this.socket.on(SignalingEvent.ERROR, (err: { code: string; message: string }) => {
      this.updateState({
        connectionStatus: 'error',
        errorMessage: err.message,
      });
    });
  }

  private async flushPendingCandidates(peerId: string, pc: RTCPeerConnection): Promise<void> {
    const queue = this.pendingIceCandidates.get(peerId);
    if (!queue || queue.length === 0) return;
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error(`[WebRTC] Failed to add buffered ICE candidate for ${peerId}:`, err);
      }
    }
    this.pendingIceCandidates.delete(peerId);
  }

  /**
   * Create RTCPeerConnection and bind Dual DataChannels + SRTP media
   */
  private async createPeerConnection(peerId: string, isInitiator: boolean): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.peerConnections.set(peerId, pc);

    // Attach local media tracks (honoring active screen share for late joiners)
    if (this.state.isScreenSharing && this.state.screenStream) {
      const screenVideoTrack = this.state.screenStream.getVideoTracks()[0];
      if (screenVideoTrack) {
        pc.addTrack(screenVideoTrack, this.state.screenStream);
      }
      const audioTrack = this.state.localStream?.getAudioTracks()[0];
      if (audioTrack) {
        pc.addTrack(audioTrack, this.state.localStream!);
      }
    } else if (this.state.localStream) {
      this.state.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.state.localStream!);
      });
    }

    // Handle incoming remote media tracks (SRTP)
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        event.track.onmute = () => {
          this.updateState({ remoteStreams: new Map(this.state.remoteStreams) });
        };
        event.track.onunmute = () => {
          this.updateState({ remoteStreams: new Map(this.state.remoteStreams) });
        };
        const newRemoteStreams = new Map(this.state.remoteStreams);
        newRemoteStreams.set(peerId, stream);
        this.updateState({ remoteStreams: newRemoteStreams });
      }
    };

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket && this.state.roomId) {
        this.socket.emit(SignalingEvent.ICE_CANDIDATE, {
          roomId: this.state.roomId,
          targetPeerId: peerId,
          senderPeerId: this.state.currentUser?.id || this.socket.id,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    if (isInitiator) {
      this.makingOffer.set(peerId, true);
      const whiteboardChannel = pc.createDataChannel('whiteboard', { ordered: true });
      const pointerChannel = pc.createDataChannel('pointer', { ordered: false, maxRetransmits: 0 });
      const fileChannel = pc.createDataChannel('file', { ordered: true });

      this.bindDataChannelEvents(peerId, whiteboardChannel, pointerChannel, fileChannel);

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        this.socket?.emit(SignalingEvent.OFFER, {
          roomId: this.state.roomId,
          targetPeerId: peerId,
          senderPeerId: this.state.currentUser?.id || this.socket.id,
          description: offer,
        });
      } finally {
        this.makingOffer.set(peerId, false);
      }
    } else {
      pc.ondatachannel = (event) => {
        const channel = event.channel;
        const current = this.dataChannels.get(peerId) || ({} as any);

        if (channel.label === 'whiteboard') {
          current.whiteboard = channel;
        } else if (channel.label === 'pointer') {
          current.pointer = channel;
        } else if (channel.label === 'file') {
          current.file = channel;
        }

        if (current.whiteboard && current.pointer && current.file) {
          this.bindDataChannelEvents(peerId, current.whiteboard, current.pointer, current.file);
        } else {
          this.dataChannels.set(peerId, current);
          this.setupSingleChannel(channel);
        }
      };
    }

    return pc;
  }

  private setupSingleChannel(channel: RTCDataChannel) {
    if (channel.label === 'whiteboard') {
      channel.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          this.whiteboardListeners.forEach((l) => l(payload));
        } catch (err) {
          console.error('Failed to parse whiteboard data channel payload:', err);
        }
      };
    } else if (channel.label === 'pointer') {
      channel.onmessage = (e) => {
        try {
          const pointer = JSON.parse(e.data);
          this.pointerListeners.forEach((l) => l(pointer));
        } catch (err) {
          console.error('Failed to parse pointer data channel payload:', err);
        }
      };
    } else if (channel.label === 'file') {
      channel.binaryType = 'arraybuffer';
      channel.onmessage = (e) => {
        if (e.data instanceof ArrayBuffer) {
          this.handleIncomingFileChunk(e.data);
        }
      };
    }
  }

  private bindDataChannelEvents(
    peerId: string,
    whiteboard: RTCDataChannel,
    pointer: RTCDataChannel,
    file: RTCDataChannel
  ) {
    this.dataChannels.set(peerId, { whiteboard, pointer, file });
    this.setupSingleChannel(whiteboard);
    this.setupSingleChannel(pointer);
    this.setupSingleChannel(file);
  }

  private async getOrCreatePeerConnection(peerId: string, isInitiator: boolean): Promise<RTCPeerConnection> {
    const existing = this.peerConnections.get(peerId);
    if (existing) return existing;
    return this.createPeerConnection(peerId, isInitiator);
  }

  /**
   * Broadcast whiteboard snapshot (Fabric JSON) over reliable DataChannel
   */
  public sendWhiteboardSnapshot(payload: WhiteboardSyncPayload): void {
    const raw = JSON.stringify(payload);
    let sentViaDataChannel = false;

    this.dataChannels.forEach(({ whiteboard }) => {
      if (whiteboard.readyState === 'open') {
        try {
          whiteboard.send(raw);
          sentViaDataChannel = true;
        } catch (e) {
          console.warn('DataChannel send failed, falling back:', e);
        }
      }
    });

    if (!sentViaDataChannel && this.socket && this.state.roomId) {
      this.socket.emit(SignalingEvent.WHITEBOARD_STROKE, payload);
    }
  }

  /**
   * Broadcast high-frequency cursor/pointer updates over unreliable DataChannel
   */
  public sendPointerMove(pointer: WhiteboardPointer): void {
    const raw = JSON.stringify(pointer);
    let sentViaDataChannel = false;

    this.dataChannels.forEach(({ pointer: pChan }) => {
      if (pChan.readyState === 'open') {
        try {
          pChan.send(raw);
          sentViaDataChannel = true;
        } catch (e) {
          // Drop pointer frames on failure
        }
      }
    });

    if (!sentViaDataChannel && this.socket && this.state.roomId) {
      this.socket.emit(SignalingEvent.POINTER_MOVE, pointer);
    }
  }

  /**
   * Chunked File Sharing with Zero-Trust AES-256-GCM Encryption & Backpressure
   */
  public async sendFile(
    file: File,
    onProgress: (pct: number) => void
  ): Promise<void> {
    const CHUNK_SIZE = 64 * 1024; // 64 KB chunks
    const fileId = crypto.randomUUID();
    let dataBuffer = await file.arrayBuffer();
    let ivBase64: string | undefined = undefined;
    let isEncrypted = false;

    if (this.state.encryptionKey) {
      const encrypted = await CryptoUtils.encryptBuffer(this.state.encryptionKey, dataBuffer);
      dataBuffer = encrypted.ciphertext;
      ivBase64 = btoa(String.fromCharCode(...encrypted.iv));
      isEncrypted = true;
    }

    const totalBytes = dataBuffer.byteLength;
    const totalChunks = Math.ceil(totalBytes / CHUNK_SIZE);

    const activeChannels = Array.from(this.dataChannels.values())
      .map((c) => c.file)
      .filter((ch) => ch.readyState === 'open');

    if (activeChannels.length === 0) return;

    let overallProgress = 0;

    await Promise.all(
      activeChannels.map(async (channel) => {
        channel.binaryType = 'arraybuffer';
        channel.bufferedAmountLowThreshold = 64 * 1024;

        let offset = 0;
        let chunkIndex = 0;

        while (offset < totalBytes) {
          if (channel.bufferedAmount > 256 * 1024) {
            await new Promise<void>((resolve) => {
              const onLow = () => {
                channel.removeEventListener('bufferedamountlow', onLow);
                resolve();
              };
              channel.addEventListener('bufferedamountlow', onLow);
            });
          }

          const chunkData = dataBuffer.slice(offset, offset + CHUNK_SIZE);

          const header = new TextEncoder().encode(
            JSON.stringify({
              fileId,
              name: file.name,
              size: file.size,
              type: file.type,
              chunkIndex,
              totalChunks,
              isEncrypted,
              iv: ivBase64,
            }).padEnd(320, ' ')
          );

          const packet = new Uint8Array(header.byteLength + chunkData.byteLength);
          packet.set(header, 0);
          packet.set(new Uint8Array(chunkData), header.byteLength);

          channel.send(packet);

          offset += CHUNK_SIZE;
          chunkIndex++;

          const currentPct = Math.round((offset / totalBytes) * 100);
          if (currentPct > overallProgress) {
            overallProgress = currentPct;
            onProgress(overallProgress);
          }
        }
      })
    );
  }

  private handleIncomingFileChunk(data: ArrayBuffer): void {
    try {
      const headerBytes = new Uint8Array(data.slice(0, 320));
      const headerStr = new TextDecoder().decode(headerBytes).trim();
      const meta = JSON.parse(headerStr);
      const chunkBytes = data.slice(320);

      this.fileListeners.forEach((l) =>
        l({
          fileId: meta.fileId,
          name: meta.name,
          size: meta.size,
          type: meta.type,
          chunkIndex: meta.chunkIndex,
          totalChunks: meta.totalChunks,
          data: chunkBytes,
          isEncrypted: meta.isEncrypted,
          iv: meta.iv,
        })
      );
    } catch (err) {
      console.error('Failed to parse incoming file chunk:', err);
    }
  }

  /**
   * Send In-Meeting Chat Message (Public or Private)
   */
  public sendChatMessage(text: string, targetId: string = 'everyone', targetName?: string): void {
    if (!text.trim() || !this.socket || !this.state.roomId || !this.state.currentUser) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      roomId: this.state.roomId,
      senderId: this.state.currentUser.id,
      senderName: this.state.currentUser.name,
      targetId: targetId === 'everyone' ? undefined : targetId,
      targetName: targetId === 'everyone' ? undefined : targetName,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      isPrivate: targetId !== 'everyone',
    };

    this.socket.emit(SignalingEvent.CHAT_MESSAGE, message);
  }

  public markChatAsRead(): void {
    this.updateState({ unreadChatCount: 0 });
  }

  /**
   * Send Floating Emoji Reaction
   */
  public sendReaction(emoji: string): void {
    if (!this.socket || !this.state.roomId || !this.state.currentUser) return;

    const reaction: ReactionPayload = {
      id: crypto.randomUUID(),
      roomId: this.state.roomId,
      senderId: this.state.currentUser.id,
      senderName: this.state.currentUser.name,
      emoji,
      timestamp: new Date().toISOString(),
    };

    this.socket.emit(SignalingEvent.REACTION, reaction);

    // Also display immediately locally
    const item = {
      id: reaction.id,
      senderId: reaction.senderId,
      senderName: reaction.senderName,
      emoji,
      timestamp: Date.now(),
    };
    this.updateState({ activeReactions: [...this.state.activeReactions, item] });
    setTimeout(() => {
      this.updateState({
        activeReactions: this.state.activeReactions.filter((r) => r.id !== item.id),
      });
    }, 3500);
  }

  /**
   * Toggle Raise Hand
   */
  public toggleRaiseHand(): boolean {
    if (!this.socket || !this.state.roomId || !this.state.currentUser) return false;

    const nextState = !this.state.isHandRaised;
    this.updateState({ isHandRaised: nextState });

    const payload: RaiseHandPayload = {
      roomId: this.state.roomId,
      senderId: this.state.currentUser.id,
      senderName: this.state.currentUser.name,
      isHandRaised: nextState,
    };

    this.socket.emit(SignalingEvent.RAISE_HAND, payload);
    return nextState;
  }

  /**
   * Host Moderation: Mute Participant (or Mute All)
   */
  public muteParticipant(targetPeerId: string | 'all', muteAudio = true): void {
    if (!this.socket || !this.state.roomId || !this.state.currentUser) return;

    const payload: MuteParticipantPayload = {
      roomId: this.state.roomId,
      requesterId: this.state.currentUser.id,
      targetPeerId,
      muteAudio,
    };

    this.socket.emit(SignalingEvent.MUTE_PARTICIPANT, payload);
  }

  /**
   * Host Moderation: Remove Participant
   */
  public removeParticipant(targetPeerId: string): void {
    if (!this.socket || !this.state.roomId || !this.state.currentUser) return;

    const payload: RemoveParticipantPayload = {
      roomId: this.state.roomId,
      requesterId: this.state.currentUser.id,
      targetPeerId,
      reason: 'The host removed you from this meeting.',
    };

    this.socket.emit(SignalingEvent.REMOVE_PARTICIPANT, payload);
  }

  /**
   * Host Moderation: Admit or Deny Guest from Waiting Room
   */
  public admitParticipant(targetUserId: string, admit = true): void {
    if (!this.socket || !this.state.roomId || !this.state.currentUser) return;

    const payload: AdmitParticipantPayload = {
      roomId: this.state.roomId,
      requesterId: this.state.currentUser.id,
      targetUserId,
      admit,
    };

    this.socket.emit(SignalingEvent.ADMIT_PARTICIPANT, payload);
  }

  /**
   * Host Moderation: Toggle Virtual Waiting Room Mode
   */
  public toggleWaitingRoom(enabled: boolean): void {
    if (!this.socket || !this.state.roomId || !this.state.currentUser) return;

    const payload: ToggleWaitingRoomPayload = {
      roomId: this.state.roomId,
      requesterId: this.state.currentUser.id,
      enabled,
    };

    this.socket.emit(SignalingEvent.TOGGLE_WAITING_ROOM, payload);
  }

  public clearHostMutedNotification(): void {
    this.updateState({ hostMutedNotification: false });
  }

  /**
   * Enumerate Media Hardware Devices
   */
  public async enumerateDevices(): Promise<{
    audioInputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
  }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return { audioInputs: [], videoInputs: [], audioOutputs: [] };
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      audioInputs: devices.filter((d) => d.kind === 'audioinput'),
      videoInputs: devices.filter((d) => d.kind === 'videoinput'),
      audioOutputs: devices.filter((d) => d.kind === 'audiooutput'),
    };
  }

  /**
   * Switch Active Microphone Input
   */
  public async switchAudioInput(deviceId: string): Promise<void> {
    const currentMuted = this.state.isAudioMuted;
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: { exact: deviceId },
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    const newAudioTrack = newStream.getAudioTracks()[0];
    newAudioTrack.enabled = !currentMuted;

    // Replace audio track on local stream
    if (this.state.localStream) {
      const oldTrack = this.state.localStream.getAudioTracks()[0];
      if (oldTrack) {
        this.state.localStream.removeTrack(oldTrack);
        oldTrack.stop();
      }
      this.state.localStream.addTrack(newAudioTrack);
    }

    // Replace track across all peer connections
    for (const pc of this.peerConnections.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'audio');
      if (sender) {
        await sender.replaceTrack(newAudioTrack);
      }
    }

    this.updateState({
      selectedAudioInputId: deviceId,
      localStream: this.state.localStream ? new MediaStream(this.state.localStream.getTracks()) : null,
    });
  }

  /**
   * Switch Active Camera Input
   */
  public async switchVideoInput(deviceId: string): Promise<void> {
    const currentMuted = this.state.isVideoMuted;
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: { exact: deviceId },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    const newVideoTrack = newStream.getVideoTracks()[0];
    newVideoTrack.enabled = !currentMuted;

    if (this.state.localStream) {
      const oldTrack = this.state.localStream.getVideoTracks()[0];
      if (oldTrack) {
        this.state.localStream.removeTrack(oldTrack);
        oldTrack.stop();
      }
      this.state.localStream.addTrack(newVideoTrack);
    }

    if (!this.state.isScreenSharing) {
      for (const pc of this.peerConnections.values()) {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }
    }

    this.updateState({
      selectedVideoInputId: deviceId,
      localStream: this.state.localStream ? new MediaStream(this.state.localStream.getTracks()) : null,
    });
  }

  /**
   * Switch Audio Output Speaker
   */
  public async switchAudioOutput(deviceId: string, element?: HTMLMediaElement): Promise<void> {
    if (element && 'setSinkId' in element) {
      await (element as any).setSinkId(deviceId);
    }
    this.updateState({ selectedAudioOutputId: deviceId });
  }

  /**
   * Real-Time WebRTC Network Quality Monitoring via RTCPeerConnection.getStats()
   */
  private startNetworkQualityMonitoring(): void {
    if (this.statsInterval) clearInterval(this.statsInterval);

    this.statsInterval = setInterval(async () => {
      if (this.peerConnections.size === 0) {
        this.updateState({ localNetworkQuality: 'excellent' });
        return;
      }

      let worstQuality: 'excellent' | 'fair' | 'poor' = 'excellent';
      const updatedRemoteQualities = new Map(this.state.networkQualities);

      for (const [peerId, pc] of this.peerConnections.entries()) {
        try {
          const stats = await pc.getStats();
          let rtt = 0;
          let packetLossPct = 0;

          stats.forEach((report) => {
            if (report.type === 'candidate-pair' && (report.state === 'succeeded' || report.nominated)) {
              rtt = report.currentRoundTripTime || 0;
            }
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              const lost = report.packetsLost || 0;
              const received = report.packetsReceived || 0;
              const total = lost + received;
              if (total > 0) {
                packetLossPct = (lost / total) * 100;
              }
            }
          });

          let peerQuality: 'excellent' | 'fair' | 'poor' = 'excellent';
          if (packetLossPct >= 8 || rtt >= 0.35) {
            peerQuality = 'poor';
          } else if (packetLossPct >= 2 || rtt >= 0.15) {
            peerQuality = 'fair';
          }

          updatedRemoteQualities.set(peerId, peerQuality);

          if (peerQuality === 'poor') {
            worstQuality = 'poor';
          } else if (peerQuality === 'fair' && worstQuality !== 'poor') {
            worstQuality = 'fair';
          }
        } catch (e) {
          // Ignore stats errors on closed peers
        }
      }

      this.updateState({
        localNetworkQuality: worstQuality,
        networkQualities: updatedRemoteQualities,
      });

      // Relay local quality to room
      if (this.socket && this.state.roomId && this.state.currentUser) {
        this.socket.emit(SignalingEvent.NETWORK_QUALITY, {
          roomId: this.state.roomId,
          userId: this.state.currentUser.id,
          quality: worstQuality,
        });
      }
    }, 3000);
  }

  private stopNetworkQualityMonitoring(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  /**
   * Toggle Audio Mute
   */
  public toggleAudio(muted?: boolean): boolean {
    if (!this.state.localStream) return false;
    const audioTrack = this.state.localStream.getAudioTracks()[0];
    if (!audioTrack) return false;

    const nextState = muted !== undefined ? !muted : !audioTrack.enabled;
    audioTrack.enabled = nextState;
    this.updateState({ isAudioMuted: !nextState });
    return !nextState;
  }

  /**
   * Toggle Video Mute
   */
  public toggleVideo(muted?: boolean): boolean {
    if (!this.state.localStream) return false;
    const videoTrack = this.state.localStream.getVideoTracks()[0];
    if (!videoTrack) return false;

    const nextState = muted !== undefined ? !muted : !videoTrack.enabled;
    videoTrack.enabled = nextState;
    this.updateState({ isVideoMuted: !nextState });
    return !nextState;
  }

  /**
   * Screen Share Hot-Swap via RTCRtpSender.replaceTrack
   */
  public async startScreenShare(): Promise<MediaStream> {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    const screenTrack = screenStream.getVideoTracks()[0];

    for (const pc of this.peerConnections.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(screenTrack);
      }
    }

    screenTrack.onended = () => {
      this.stopScreenShare();
    };

    this.updateState({ screenStream, isScreenSharing: true });
    return screenStream;
  }

  public async stopScreenShare(): Promise<void> {
    if (!this.state.screenStream) return;

    this.state.screenStream.getTracks().forEach((track) => track.stop());
    const cameraTrack = this.state.localStream?.getVideoTracks()[0] || null;

    for (const pc of this.peerConnections.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(cameraTrack);
      }
    }

    this.updateState({ screenStream: null, isScreenSharing: false });
  }

  private cleanupPeer(peerId: string): void {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
    const stream = this.state.remoteStreams.get(peerId);
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    this.dataChannels.delete(peerId);
    this.pendingIceCandidates.delete(peerId);
    this.makingOffer.delete(peerId);
    this.ignoreOffer.delete(peerId);
  }

  public disconnect(): void {
    this.stopNetworkQualityMonitoring();

    if (this.state.screenStream) {
      this.state.screenStream.getTracks().forEach((t) => t.stop());
    }
    if (this.state.localStream) {
      this.state.localStream.getTracks().forEach((t) => t.stop());
    }
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.dataChannels.clear();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.updateState({
      connectionStatus: 'disconnected',
      localStream: null,
      screenStream: null,
      remoteStreams: new Map(),
      participants: [],
      roomId: null,
      room: null,
      isWaitingRoom: false,
    });
  }
}

export const webrtcManager = new WebRTCConnectionManager();
