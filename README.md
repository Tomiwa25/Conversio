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

### 3. Client-Side AES-256-GCM Zero-Trust Data Encryption
* Shared files can be encrypted client-side using the **Web Crypto API** (`crypto.subtle`) with a 256-bit symmetric key derived via PBKDF2 (100,000 iterations of SHA-256) from a room passphrase.
* Every file transfer generates a unique 12-byte initialization vector (`IV`) and verifies the 16-byte GCM authentication tag upon reconstruction.

### 4. Cryptographic Room Admission Tokens (JWT)
* Replaced insecure query string roles with HMAC-SHA256 signed admission tokens issued on `POST /api/rooms` and `POST /api/rooms/:id/join`.
* Sockets authenticate in `socket.handshake.auth.token` before admission into room signaling channels, preventing role spoofing and unauthorized room locks.

### 5. Memory-Mindful Fabric.js Whiteboard
* Canvas objects set `objectCaching = false` for high-frequency pencil paths.
* Undo/redo history is capped at a strict depth limit (max 15 snapshots) to prevent unbounded memory growth.
* Clean unmount disposal via `canvas.dispose()`.
* State synchronization uses Fabric's built-in `canvas.toJSON()` and `canvas.loadFromJSON()` with debounced broadcast to prevent recursive broadcast loops.

---

## ⚙️ Environment Variables Audit

| Variable | Location | Default / Example | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend | `4000` | Port for Express & Socket.io server |
| `NODE_ENV` | Both | `development` / `production` | Node environment |
| `CORS_ORIGIN` | Backend | `http://localhost:3000` | Allowed frontend origins for CORS and Socket.io |
| `JWT_SECRET` | Backend | `conversio-secret...` | Secret key used to sign and verify admission tokens |
| `REDIS_URL` | Backend | `redis://localhost:6379` | Optional: Redis instance for distributed locks and cluster scaling |
| `IDEMPOTENCY_TTL_SECONDS` | Backend | `86400` (24h) | Cache lifetime for idempotent room responses |
| `LOCK_MUTEX_TTL_SECONDS` | Backend | `15` | Distributed mutex lock acquisition TTL |
| `NEXT_PUBLIC_SERVER_URL` | Frontend | `http://localhost:4000` | Backend API and WebSocket URL |
| `NEXT_PUBLIC_STUN_SERVER_1` | Frontend | `stun:stun.l.google.com:19302` | Primary STUN server for ICE candidate discovery |
| `NEXT_PUBLIC_STUN_SERVER_2` | Frontend | `stun:stun1.l.google.com:19302` | Secondary STUN server fallback |
| `NEXT_PUBLIC_TURN_SERVER_URL` | Frontend | `turn:localhost:3478` | TURN relay server for symmetric NAT traversal |
| `NEXT_PUBLIC_TURN_USERNAME` | Frontend | `conversio_user` | TURN credential username |
| `NEXT_PUBLIC_TURN_CREDENTIAL` | Frontend | `conversio_secret_password` | TURN credential password |

---

## 🚀 Getting Started

### Local Development
```bash
# 1. Install dependencies across workspaces
npm install

# 2. Concurrently run signaling backend (port 4000) and Next.js frontend (port 3000)
npm run dev
```

* **Frontend**: [http://localhost:3000](http://localhost:3000)
* **Backend API & Health**: [http://localhost:4000/health](http://localhost:4000/health)

### Running Verification Tests
```bash
# Run backend idempotency, OCC locking, and JWT security test suite (12/12 passing)
npm run test:server
```

### Production Deployment via Docker Compose
To launch the full production cluster (Redis + Coturn STUN/TURN + Node Server + Next.js App):
```bash
docker compose up -d --build
```
