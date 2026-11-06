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

- User authentication.
- Remote persistence for Habits and Entries only.
- Synchronization between clients and the backend.
- User data isolation.

## Authentication

- Better Auth provides email OTP sign-in and sessions. A valid OTP for an unknown email creates a User.
- Development logs OTPs. Staging uses Resend's shared test sender, which is limited to verified test recipients until a sending domain is configured. Production uses Resend with `RESEND_FROM_EMAIL` on a verified domain.
- Configure `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` in every runtime stage; use HTTPS for staging and production. Staging and production require `RESEND_API_KEY`; production also requires `RESEND_FROM_EMAIL`.
- Alpha 1 deletion removes Better Auth records. When Alpha 2 adds remote habit data, User deletion must remove it too.

## Data ownership and storage

- PostgreSQL is the remote persistent store.
- TinyBase persists user data as tabular data in PostgreSQL. The backend does not define or maintain separate application tables for Habits and Entries.
- Remote data belongs to an authenticated User.
- Users must not be able to read or modify another User's data.

## Synchronization model

- TinyBase is responsible for synchronization and merge behavior.
- Use TinyBase mergeable stores and its CRDT/LWW semantics.
- The client is assumed to use a TinyBase mergeable store.
- Clients synchronize with the backend over a WebSocket connection provided by TinyBase.
- Do not add custom conflict-resolution behavior initially.

The exact TinyBase integration, WebSocket setup, persistence adapter, and remote data deletion behavior remain implementation-time research tasks.
