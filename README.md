# Conversio 🌐
### Enterprise Real-Time WebRTC Conferencing & Collaboration Platform

Conversio is a real-time multi-user video conferencing and collaboration suite built with **Next.js (TypeScript) + Tailwind CSS**, **Node.js + Socket.io**, and **WebRTC**.

---

## 🏛️ Key Engineering Patterns

### 1. Idempotency for Room Creation & Atomic Locking
* **Idempotency Key Verification**: The client generates a UUIDv4 `x-idempotency-key` when creating a meeting. The backend's `IdempotencyService` creates an atomic distributed lock (`SET NX EX 15`), computes a SHA-256 fingerprint of the request payload, and caches resolved responses. Subsequent retries replay the cached room payload without creating duplicate rooms or split-brain database states.
* **Optimistic Concurrency Control (OCC) for Room Locking**: Room lock operations accept `expectedVersion`. Concurrent or stale lock requests return `409 Conflict` with `versionMismatch: true`, while valid locks increment the room version and broadcast instant `ROOM_LOCK_UPDATE` signals to reject unauthorized peer negotiations.

### 2. Audio/Video (SRTP) vs DataChannel (SCTP) Separation
* **SRTP Media (UDP)**: Audio, video, and screen sharing streams run on separate loss-tolerant, jitter-sensitive media tracks. Screen sharing uses `RTCRtpSender.replaceTrack` to hot-swap video tracks without triggering full renegotiations.
* **Dual SCTP DataChannels**:
  * **Whiteboard Channel (`ordered: true`)**: Transmits Fabric.js vector canvas operations and state snapshots.
  * **Pointer Channel (`ordered: false, maxRetransmits: 0`)**: Unreliable, unordered delivery for high-frequency cursor/pointer coordinates with zero head-of-line blocking.
  * **File Channel (`ordered: true`)**: Direct peer binary transfer using 64KB chunking with `bufferedAmountLow` backpressure monitoring to prevent browser memory exhaustion.

### 3. Memory-Mindful Fabric.js Whiteboard
* Canvas objects set `objectCaching = false` for high-frequency pencil paths.
* Undo/redo history is capped at a strict depth limit (max 15 snapshots) to prevent unbounded memory growth.
* Clean unmount disposal via `canvas.dispose()`.
* State synchronization uses Fabric's built-in `canvas.toJSON()` and `canvas.loadFromJSON()` with debounced broadcast to prevent recursive broadcast loops.

---

## 🚀 Getting Started

### Prerequisites
* Node.js >= 18 (Tested on Node.js v24)
* npm >= 9

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd Conversio

# Install all workspace dependencies
npm install
```

### Running the Full Stack (Server + Client)
```bash
# Concurrently starts the signaling backend (port 4000) and Next.js client (port 3000)
npm run dev
```

* **Client**: [http://localhost:3000](http://localhost:3000)
* **Backend API & Health**: [http://localhost:4000/health](http://localhost:4000/health)

### Running Verification Tests
```bash
# Run backend idempotency and concurrency test suite
npm run test:server
```
