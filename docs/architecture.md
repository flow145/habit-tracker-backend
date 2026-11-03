# Backend Architecture

## Stack

- Package manager: pnpm
- Runtime: Node.js
- Language: TypeScript
- Framework: Express
- Database: PostgreSQL
- Synchronization: TinyBase
- Authentication: Better Auth
- Logging: Pino
- Containerization: Docker
- Application hosting: Render
- Database hosting: Supabase
- Monitoring: TBD

## Responsibilities

The backend provides:

- Email OTP authentication and session management.
- Remote persistence for Habits and Entries only.
- TinyBase synchronization between clients and the backend.
- Account data isolation and account deletion.
- Device management in a later iteration.

## Data ownership and storage

- PostgreSQL is the remote persistent store.
- TinyBase persists account data as tabular data in PostgreSQL. The backend does not define or maintain separate application tables for Habits and Entries.
- Remote data belongs to an authenticated account.
- Users must not be able to read or modify another account's data.

## Synchronization model

- TinyBase is responsible for synchronization and merge behavior.
- Use TinyBase mergeable stores and its CRDT/LWW semantics.
- The client is assumed to use a TinyBase mergeable store.
- Clients synchronize with the backend over a WebSocket connection provided by TinyBase.
- Do not add custom conflict-resolution behavior initially.

The exact TinyBase integration, WebSocket setup, persistence adapter, and deletion behavior remain implementation-time research tasks.
