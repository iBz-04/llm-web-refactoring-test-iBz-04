/**
 * @file packages/shared-types/src/session.ts
 * @contents Shared TypeScript types for cookie session shape and JWT payload used in gRPC auth.
 * @use Imported by API middleware and any cross-package auth typing.
 */

/**
 * Session data stored in cookies
 */
export interface SessionData {
	userId: string;
	username: string;
	role: "user" | "admin" | "moderator";
}

/**
 * JWT payload for gRPC authentication
 */
export interface GrpcSessionPayload {
	userId: string;
	username: string;
	role: "user" | "admin" | "moderator";
	iat: number;
	exp: number;
}
