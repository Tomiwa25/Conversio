# Conversio System Architecture (SITE.md)

## 1. Product Summary
Conversio is a privacy-first, enterprise-grade real-time communication platform combining peer-to-peer WebRTC video conferencing, LiveKit SFU mesh offloading, zero-trust client-side file encryption (AES-256-GCM), collaborative vector whiteboarding, and persistent team collaboration hubs.

---

## 2. Route Matrix

| Route | Role / Scope | Primary Components | State & Services |
| :--- | :--- | :--- | :--- |
| `/` | Landing & Instant Join | `LandingSections`, `LandingHero`, `StartOrJoin`, `SiteHeader`, `SiteFooter` | `auth.context`, Room Creation API, Code Validation |
| `/room/[id]` | Live Video Conference Room | `VideoGrid`, `RoomControls`, `Whiteboard`, `FileShare`, `ChatDrawer`, `ParticipantsDrawer`, `BreakoutRoomsModal`, `VirtualWaitingRoom` | `webrtc.context`, `webrtc.manager`, `recording.manager` |
| `/signin` | User Authentication | `SignInView` (Login / Register / Forgot Password) | `auth.context`, `authService` |
| `/signup` | User Registration | `SignInView` (Direct Signup Mode) | `auth.context`, `authService` |

---

## 3. Communication App Feature Tiers

### A. Basic Features
* Dual-token JWT authentication (15m Access Token, 7d Refresh Token).
* Instant peer-to-peer WebRTC 1-on-1 audio/video conferencing.
* One-click microphone mute and camera disable toggles.
* Real-time in-room text chat with timestamps.
* Participant presence indicators (connected, waiting, disconnected).

### B. Intermediate Features
* High-definition screen sharing with seamless `RTCRtpSender.replaceTrack` track hot-swapping.
* Media device switcher (mic, camera, speaker) with live Web Audio API input level meters.
* Room passcode hashing and verification.
* Optimistic Concurrency Control (OCC) meeting locks with version checking.
* Persistent channel messaging (`/api/channels`) and 1-on-1 direct messaging (`/api/channels/direct`).
* Meeting scheduler with timezones, recurrence rules (RRULE), and invitee tracking (`/api/schedule`).

### C. Advanced Features
* **Zero-Trust Client Encryption**: Client-side AES-256-GCM encryption with PBKDF2 100k iteration SHA-256 key derivation for direct file sharing over SCTP data channels.
* **Vector Whiteboard**: Real-time collaborative Fabric.js canvas with vector path sync, shapes, eraser, undo/redo stack limits, and image import.
* **Dynamic Breakout Rooms**: Host-managed breakout sessions with countdown timers, auto-reassignment, and host announcement broadcasts.
* **Dual Mesh/SFU Engine**: Peer-to-peer WebRTC mesh for ultra-low latency small rooms + LiveKit SFU automatic offloading for large meetings.
* **Virtual Waiting Room**: Host admission gatekeeper for sensitive meetings.
* **Distributed Idempotency & Fault Tolerance**: Redis-backed distributed locks (`SET NX EX 15`) with in-memory fallbacks and payload fingerprinting.

---

## 4. Security Architecture & Threat Defenses

1. **Password Reset Poisoning Prevention**:
   * Reset links strictly bind to server-configured `FRONTEND_URL` / `APP_URL`, completely ignoring untrusted `Host` and `X-Forwarded-Host` headers.
   * Host Header Whitelist Middleware rejecting unapproved host spoofing.
   * Single-use SHA-256 hashed reset tokens expiring in 15 minutes.
   * Automatic invalidation of all existing refresh tokens upon password reset.
2. **Cryptographic Room Admission**:
   * Ephemeral HMAC-SHA256 tokens issued on room create/join, verified in Socket.io handshake auth to prevent role spoofing.
3. **Data Integrity & Consistency**:
   * Atomic PostgreSQL transactions (`BEGIN ... COMMIT ... ROLLBACK`) for multi-step mutations.
   * Foreign keys with cascading deletions and compound primary keys on relation tables.
   * Optimistic Concurrency Control on room state modifications.
