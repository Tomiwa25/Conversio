import { io, Socket } from 'socket.io-client';
import {
  IceCandidatePayload,
  JoinRoomPayload,
  Participant,
  Room,
  RoomLockState,
  SdpPayload,
  SignalingEvent,
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
  private dataChannels: Map<
    string,
    {
      whiteboard: RTCDataChannel;
      pointer: RTCDataChannel;
      file: RTCDataChannel;
    }
  > = new Map();

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
  public async initializeMedia(video = true, audio = true): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
      });

      this.updateState({
        localStream: stream,
        isAudioMuted: !audio,
        isVideoMuted: !video,
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

    // Room initial state snapshot
    this.socket.on(SignalingEvent.ROOM_STATE, async (payload: { room: Room; participants: Participant[] }) => {
      this.updateState({
        room: payload.room,
        participants: payload.participants,
        isLocked: payload.room.lockState.isLocked,
        lockVersion: payload.room.lockState.lockVersion,
        connectionStatus: 'connected',
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
      // The joining peer will create the offer; we wait for their offer
    });

    // Peer departed
    this.socket.on(SignalingEvent.PEER_LEFT, (payload: { participantId: string }) => {
      this.cleanupPeer(payload.participantId);
      const updated = this.state.participants.filter((p) => p.id !== payload.participantId);
      const newRemoteStreams = new Map(this.state.remoteStreams);
      newRemoteStreams.delete(payload.participantId);
      this.updateState({ participants: updated, remoteStreams: newRemoteStreams });
    });

    // WebRTC Offer received
    this.socket.on(SignalingEvent.OFFER, async (payload: SdpPayload) => {
      const pc = await this.getOrCreatePeerConnection(payload.senderPeerId, false);
      await pc.setRemoteDescription(new RTCSessionDescription(payload.description));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.socket?.emit(SignalingEvent.ANSWER, {
        roomId: payload.roomId,
        targetPeerId: payload.senderPeerId,
        senderPeerId: this.socket.id,
        description: answer,
      });
    });

    // WebRTC Answer received
    this.socket.on(SignalingEvent.ANSWER, async (payload: SdpPayload) => {
      const pc = this.peerConnections.get(payload.senderPeerId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.description));
      }
    });

    // WebRTC ICE Candidate received
    this.socket.on(SignalingEvent.ICE_CANDIDATE, async (payload: IceCandidatePayload) => {
      const pc = this.peerConnections.get(payload.senderPeerId);
      if (pc && payload.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
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

    // Signaling error / Room locked rejection
    this.socket.on(SignalingEvent.ERROR, (err: { code: string; message: string }) => {
      this.updateState({
        connectionStatus: 'error',
        errorMessage: err.message,
      });
    });
  }

  /**
   * Create RTCPeerConnection and bind Dual DataChannels + SRTP media
   */
  private async createPeerConnection(peerId: string, isInitiator: boolean): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.peerConnections.set(peerId, pc);

    // Attach local media tracks
    if (this.state.localStream) {
      this.state.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.state.localStream!);
      });
    }

    // Handle incoming remote media tracks (SRTP)
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
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
          senderPeerId: this.socket.id,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    if (isInitiator) {
      // Create Dual DataChannels on the initiator side
      // 1. Reliable DataChannel for Whiteboard (Fabric JSON) & File chunks
      const whiteboardChannel = pc.createDataChannel('whiteboard', { ordered: true });
      // 2. Unreliable, Unordered DataChannel for high-frequency cursor/pointer coordinates
      const pointerChannel = pc.createDataChannel('pointer', { ordered: false, maxRetransmits: 0 });
      // 3. Reliable DataChannel with backpressure for files
      const fileChannel = pc.createDataChannel('file', { ordered: true });

      this.bindDataChannelEvents(peerId, whiteboardChannel, pointerChannel, fileChannel);

      // Create Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.socket?.emit(SignalingEvent.OFFER, {
        roomId: this.state.roomId,
        targetPeerId: peerId,
        senderPeerId: this.socket.id,
        description: offer,
      });
    } else {
      // Receiver side: listen for incoming DataChannels
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
          // File header + chunk handling
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

    // Fallback over Socket.io if DataChannels not yet established
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
          // Ignore dropped pointer frames (unreliable delivery design)
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

    // Apply Client-Side AES-256-GCM Zero-Trust Encryption if key is configured
    if (this.state.encryptionKey) {
      const encrypted = await CryptoUtils.encryptBuffer(this.state.encryptionKey, dataBuffer);
      dataBuffer = encrypted.ciphertext;
      ivBase64 = btoa(String.fromCharCode(...encrypted.iv));
      isEncrypted = true;
    }

    const totalBytes = dataBuffer.byteLength;
    const totalChunks = Math.ceil(totalBytes / CHUNK_SIZE);

    for (const [peerId, { file: channel }] of this.dataChannels.entries()) {
      if (channel.readyState !== 'open') continue;

      channel.binaryType = 'arraybuffer';
      channel.bufferedAmountLowThreshold = 64 * 1024; // 64 KB buffer threshold

      let offset = 0;
      let chunkIndex = 0;

      while (offset < totalBytes) {
        // Backpressure check: wait if bufferedAmount exceeds limit
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

        // Prepend binary header: metadata padded to 320 bytes
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
        onProgress(Math.round((offset / totalBytes) * 100));
      }
    }
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

    // Hot-swap video track across all active peer senders without renegotiation
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

    // Swap back to camera track
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
    this.dataChannels.delete(peerId);
  }

  public disconnect(): void {
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
    });
  }
}

export const webrtcManager = new WebRTCConnectionManager();

