/**
 * @file apps/api/src/middleware/auth.ts
 * @contents JWT creation and verification for gRPC `session_token` payloads (`AuthContext`).
 * @use Imported by auth flows, all gRPC handlers that call `validateSessionToken` / `requireAuth`.
 */

import type { GrpcSessionPayload } from "@chirp/shared-types";
import jwt from "jsonwebtoken";
import { AppError } from "../grpc/errors";

const JWT_SECRET = process.env.GRPC_JWT_SECRET || "chirp-grpc-jwt-secret-key-at-least-32-chars";

export interface AuthContext {
	userId: string;
	username: string;
	role: "user" | "admin" | "moderator";
}

/**
 * Validates a session token and returns the auth context
 */
export function validateSessionToken(token: string): AuthContext {
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as GrpcSessionPayload;
		return {
			userId: decoded.userId,
			username: decoded.username,
			role: decoded.role,
		};
	} catch {
		throw new AppError("Invalid or expired session token", "UNAUTHENTICATED");
	}
}

/**
 * Creates a session token from auth context
 */
export function createSessionToken(
	context: AuthContext,
	expiresInSeconds: number = 7 * 24 * 60 * 60,
): string {
	return jwt.sign(
		{
			userId: context.userId,
			username: context.username,
			role: context.role,
		},
		JWT_SECRET,
		{ expiresIn: expiresInSeconds },
	);
}

/**
 * Requires authentication - throws if token is invalid
 */
export function requireAuth(token: string | undefined): AuthContext {
	if (!token) {
		throw new AppError("Authentication required", "UNAUTHENTICATED");
	}
	return validateSessionToken(token);
}

/**
 * Requires admin or moderator role
 */
export function requireAdmin(context: AuthContext): void {
	if (context.role !== "admin" && context.role !== "moderator") {
		throw new AppError("Admin access required", "PERMISSION_DENIED");
	}
}

/**
 * Requires admin role specifically
 */
export function requireSuperAdmin(context: AuthContext): void {
	if (context.role !== "admin") {
		throw new AppError("Super admin access required", "PERMISSION_DENIED");
	}
}

export { JWT_SECRET };
