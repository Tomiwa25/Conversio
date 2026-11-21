# Conversio Developer Guide (CLAUDE.md)

## Tech Stack
- **Monorepo**: npm workspaces (`apps/client`, `apps/server`, `packages/shared`)
- **Frontend**: Next.js 15 (App Router, React 19, TypeScript), Tailwind CSS, Fabric.js (whiteboard), WebRTC + SCTP DataChannels
- **Backend**: Node.js, Express, Socket.io (signaling), LiveKit SFU SDK, JWT (HMAC-SHA256), PostgreSQL (optional via pg), Redis (optional via ioredis)
- **Shared**: `@conversio/shared` TypeScript type contracts (signaling, room, auth, whiteboard)

## Build & Run Commands
- **Install dependencies**: `npm install`
- **Build shared types**: `npm run build:shared` (runs automatically in `predev`)
- **Full-stack dev server**: `npm run dev` (runs backend on `:4000`, frontend on `:3000`)
- **Backend dev**: `npm run dev:server` (or `npm --workspace=@conversio/server run dev`)
- **Client dev**: `npm run dev:client` (or `npm --workspace=@conversio/client run dev`)
- **Client typecheck**: `npm --workspace=@conversio/client exec -- tsc --noEmit`
- **Build all**: `npm run build`

## Testing
- **Backend verification test suite**: `npm run test:server`
  - Covers: Idempotency, OCC room locking, JWT authentication, LiveKit token generation, team channels/hub, and password reset poisoning defense.
- **Run single test**: `npx tsx apps/server/src/tests/<test-file>.ts`

## Key Entry Points & Structure
- `apps/client/src/app/page.tsx` — Landing page with instant room join/creation
- `apps/client/src/app/room/[id]/page.tsx` — Live video conference room & controls
- `apps/client/src/components/video/` — VideoGrid, MediaControls, DeviceSelector
- `apps/client/src/components/whiteboard/` — Collaborative Fabric.js vector canvas
- `apps/client/src/components/files/` — SCTP chunked peer-to-peer file transfer (AES-256-GCM)
- `apps/server/src/index.ts` — Express app + Socket.io server initialization
- `apps/server/src/gateways/SignalingGateway.ts` — WebRTC signaling & peer negotiation
- `apps/server/src/routes/` — Express route handlers (`auth`, `rooms`, `channels`, `schedule`)
- `packages/shared/src/types/` — Shared interfaces and signaling event constants

## Code Style & Architectural Conventions
- **Signaling vs Media**: Audio/video streams run via WebRTC SRTP/LiveKit SFU; non-media state (chat, vector strokes, pointers) uses SCTP DataChannels or Socket.io signaling.
- **Zero-Trust Encryption**: Files shared over data channels use Web Crypto API (AES-256-GCM + PBKDF2).
- **Concurrency & Idempotency**: Room creation requires `x-idempotency-key`; state mutations enforce OCC `expectedVersion`.
- **Git Commit Convention**: Conventional Commits (`feat(...)`, `fix(...)`, `refactor(...)`).
