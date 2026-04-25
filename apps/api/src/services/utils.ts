/**
 * @file apps/api/src/services/utils.ts
 * @contents Password hashing (Argon2id + legacy SHA-256 verify), ID helper, protobuf timestamp conversion.
 * @use Imported by `auth.service`, `db/seed`, tests, and handlers needing timestamp mapping.
 */

import argon2 from "argon2";
import { createHash } from "crypto";

/**
 * Generate a simple ID
 */
export function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** PHC-style Argon2id strings start with this prefix (see `argon2` package output). */
export function isArgon2idPasswordHash(stored: string): boolean {
	return stored.startsWith("$argon2id$");
}

function hashLegacySha256(password: string): string {
	const hash = createHash("sha256");
	hash.update(password + "salt");
	return hash.digest("hex");
}

function argon2HashOptions(): argon2.Options & { type: typeof argon2.argon2id } {
	// Lighter parameters in unit tests; production uses OWASP-aligned defaults.
	if (process.env.VITEST === "true") {
		return { type: argon2.argon2id, memoryCost: 8192, timeCost: 1, parallelism: 1 };
	}
	return { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };
}

/**
 * Hash password with Argon2id (new format). Legacy SHA-256 hashes in the DB are
 * detected by `verifyPassword` and upgraded on successful login.
 */
export async function hashPassword(password: string): Promise<string> {
	return argon2.hash(password, argon2HashOptions());
}

/**
 * Verify password against stored hash (Argon2id or legacy SHA-256 + static salt).
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
	if (isArgon2idPasswordHash(hashedPassword)) {
		try {
			return await argon2.verify(hashedPassword, password);
		} catch {
			return false;
		}
	}
	return hashLegacySha256(password) === hashedPassword;
}

/**
 * Convert Date to protobuf Timestamp
 */
export function toProtoTimestamp(date: Date): { seconds: bigint; nanos: number } {
	const ms = date.getTime();
	return {
		seconds: BigInt(Math.floor(ms / 1000)),
		nanos: (ms % 1000) * 1000000,
	};
}

/**
 * Convert protobuf Timestamp to Date
 */
export function fromProtoTimestamp(timestamp: { seconds: bigint; nanos: number }): Date {
	return new Date(Number(timestamp.seconds) * 1000 + timestamp.nanos / 1000000);
}
