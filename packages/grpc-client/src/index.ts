/**
 * @file packages/grpc-client/src/index.ts
 * @contents Public exports for `@chirp/grpc-client`.
 * @use Dependency of client-admin and client-user.
 */

// Re-export proto types for convenience
export * from "@chirp/proto";
export type { ChirpClient, ChirpClientConfig } from "./client";
export { createChirpClient, DEFAULT_GRPC_HOST } from "./client";
