# Backend Requirements

## Purpose

Provide optional account-based synchronization of habit data across devices and platforms.

Users can use the app without an account. Local-first functionality and offline habit tracking must continue to work independently of the backend.

## Authentication and accounts

- Support account sign-up and sign-in with email one-time passwords (OTP).
- Support sign-out without deleting local data.
- Support account deletion, including deletion of the account's remote data.
- Leave local data untouched after account deletion.

## Data

- Store Habits and their Entries in the backend database.
- Users must only be able to access their own remote data.
- Deleting a Habit must also remove its Entries.
- UI preferences and other device-specific state remain local.

## Synchronization

- Synchronize an authenticated user's Habits and Entries across their devices.
- Start synchronization immediately after sign-up or sign-in.
- Merge local and remote data when both contain data.
- Continue to support local use while offline; synchronize changes after reconnection.
- For now, signing into another account on a device with existing local data also merges the data.

## Data recovery

- Users can recover synchronized data from the backend database by signing in on a device with an empty local database.
