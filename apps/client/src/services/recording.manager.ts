'use client';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
}

export type RecordingListener = (state: RecordingState) => void;

export class RecordingManager {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<RecordingListener> = new Set();

  private state: RecordingState = {
    isRecording: false,
    isPaused: false,
    elapsedSeconds: 0,
  };

  public getState(): RecordingState {
    return { ...this.state };
  }

  public subscribe(listener: RecordingListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private updateState(partial: Partial<RecordingState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l(this.getState()));
  }

  /**
   * Start In-Meeting Recording with Multi-Track Audio Mixing
   */
  public async startRecording(options: {
    videoStream: MediaStream | null;
    localAudioStream: MediaStream | null;
    remoteAudioStreams: MediaStream[];
  }): Promise<void> {
    if (this.state.isRecording) return;
    this.recordedChunks = [];

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioCtx();
    const destination = this.audioContext.createMediaStreamDestination();

    // 1. Connect Local Audio Track
    if (options.localAudioStream && options.localAudioStream.getAudioTracks().length > 0) {
      try {
        const localSource = this.audioContext.createMediaStreamSource(options.localAudioStream);
        localSource.connect(destination);
      } catch (e) {
        console.warn('[Recorder] Failed to mix local audio:', e);
      }
    }

    // 2. Connect Remote Audio Tracks
    for (const rStream of options.remoteAudioStreams) {
      if (rStream.getAudioTracks().length > 0) {
        try {
          const remoteSource = this.audioContext.createMediaStreamSource(rStream);
          remoteSource.connect(destination);
        } catch (e) {
          console.warn('[Recorder] Failed to mix remote audio:', e);
        }
      }
    }

    // 3. Assemble Combined Recording Stream
    const combinedStream = new MediaStream();

    // Add Video Track (Prefer active screen stream, fallback to camera)
    if (options.videoStream && options.videoStream.getVideoTracks().length > 0) {
      combinedStream.addTrack(options.videoStream.getVideoTracks()[0]);
    }

    // Add Mixed Audio Track
    if (destination.stream.getAudioTracks().length > 0) {
      combinedStream.addTrack(destination.stream.getAudioTracks()[0]);
    }

    // Select supported MIME Type
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

    this.mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: selectedMime,
      videoBitsPerSecond: 2500000, // 2.5 Mbps crisp video
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.exportRecording(selectedMime);
    };

    this.mediaRecorder.start(1000); // 1-second chunks

    // Start Elapsed Timer
    this.updateState({ isRecording: true, isPaused: false, elapsedSeconds: 0 });
    this.timerInterval = setInterval(() => {
      if (!this.state.isPaused) {
        this.updateState({ elapsedSeconds: this.state.elapsedSeconds + 1 });
      }
    }, 1000);
  }

  public pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.updateState({ isPaused: true });
    }
  }

  public resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.updateState({ isPaused: false });
    }
  }

  public stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.updateState({ isRecording: false, isPaused: false, elapsedSeconds: 0 });
  }

  private exportRecording(mimeType: string): void {
    if (this.recordedChunks.length === 0) return;

    const blob = new Blob(this.recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `conversio-meeting-recording-${timestamp}.webm`;

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
}

export const recordingManager = new RecordingManager();
