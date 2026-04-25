/**
 * @file apps/api/src/services/auth.service.test.ts
 * @contents Unit tests for `auth.service.ts` service logic.
 * @use Executed by the API Vitest suite (`pnpm --filter @chirp/api test`).
 */

import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createTestUser } from "../../tests/helpers";
import { db, schema } from "../db";
import { getCurrentUser, loginUser, registerUser } from "./auth.service";
import { generateId, isArgon2idPasswordHash } from "./utils";

/** Pre-Argon2id format (matches former `hashPassword` in utils). */
function legacySha256PasswordHash(password: string): string {
	const hash = createHash("sha256");
	hash.update(password + "salt");
	return hash.digest("hex");
}

const { users } = schema;

describe("AuthService", () => {
	describe("registerUser", () => {
		it("registers a new user with valid input", async () => {
			const result = await registerUser({
				email: "new@example.com",
				username: "newuser",
				displayName: "New User",
				password: "password123",
			});

			expect(result.userId).toBeDefined();
			expect(result.sessionToken).toBeDefined();

			// Verify user was created in database
			const user = await db.select().from(users).where(eq(users.id, result.userId)).get();

			expect(user).toBeDefined();
			expect(user?.email).toBe("new@example.com");
			expect(user?.username).toBe("newuser");
			expect(user?.role).toBe("user");
			expect(user?.passwordHash).toBeDefined();
			expect(isArgon2idPasswordHash(user!.passwordHash)).toBe(true);
		});

		it("rejects duplicate email", async () => {
			await createTestUser({ email: "taken@example.com" });

			await expect(
				registerUser({
					email: "taken@example.com",
					username: "newuser",
					displayName: "New User",
					password: "password123",
				}),
			).rejects.toThrow("User with this email already exists");
		});

		it("rejects duplicate username", async () => {
			await createTestUser({ username: "takenname" });

			await expect(
				registerUser({
					email: "new@example.com",
					username: "takenname",
					displayName: "New User",
					password: "password123",
				}),
			).rejects.toThrow("Username already taken");
		});
	});

	describe("loginUser", () => {
		it("logs in with valid credentials", async () => {
			await createTestUser({
				email: "login@example.com",
				password: "correctpassword",
			});

			const result = await loginUser({
				email: "login@example.com",
				password: "correctpassword",
			});

			expect(result.userId).toBeDefined();
			expect(result.sessionToken).toBeDefined();
		});

		it("rejects invalid email", async () => {
			await expect(
				loginUser({
					email: "nonexistent@example.com",
					password: "password123",
				}),
			).rejects.toThrow("Invalid email or password");
		});

		it("rejects invalid password", async () => {
			await createTestUser({
				email: "user@example.com",
				password: "correctpassword",
			});

			await expect(
				loginUser({
					email: "user@example.com",
					password: "wrongpassword",
				}),
			).rejects.toThrow("Invalid email or password");
		});

		it("rejects banned user", async () => {
			const user = await createTestUser({
				email: "banned@example.com",
				password: "password123",
			});

			// Ban the user
			await db
				.update(users)
				.set({
					bannedAt: new Date(),
					bannedReason: "Violated ToS",
				})
				.where(eq(users.id, user.id));

			await expect(
				loginUser({
					email: "banned@example.com",
					password: "password123",
				}),
			).rejects.toThrow("Account banned: Violated ToS");
		});

		it("accepts legacy SHA-256 hash and upgrades to Argon2id on login", async () => {
			const id = generateId();
			const email = `legacy-${id}@example.com`;
			const password = "legacy-secret-9";

			await db.insert(users).values({
				id,
				email,
				username: `legacyuser-${id}`,
				displayName: "Legacy User",
				passwordHash: legacySha256PasswordHash(password),
				role: "user",
			});

			const before = await db.select().from(users).where(eq(users.id, id)).get();
			expect(before?.passwordHash).toBeDefined();
			expect(isArgon2idPasswordHash(before!.passwordHash)).toBe(false);

			const result = await loginUser({ email, password });
			expect(result.userId).toBe(id);

			const after = await db.select().from(users).where(eq(users.id, id)).get();
			expect(isArgon2idPasswordHash(after!.passwordHash)).toBe(true);
			expect(after!.passwordHash).not.toBe(before!.passwordHash);
		});
	});

	describe("Password Security", () => {
		it("proves the legacy vulnerability existed (identical passwords yield identical hashes)", () => {
			const pass = "common-password";
			const hash1 = legacySha256PasswordHash(pass);
			const hash2 = legacySha256PasswordHash(pass);
			
			// This proves the vulnerability: no per-user salt means identical hashes,
			// allowing rainbow table attacks.
			expect(hash1).toBe(hash2);
			expect(hash1).not.toContain("$"); // Not a PHC format
		});

		it("proves the vulnerability is resolved (Argon2id yields unique hashes for identical passwords)", async () => {
			const { hashPassword } = await import("./utils");
			const pass = "common-password";
			const hash1 = await hashPassword(pass);
			const hash2 = await hashPassword(pass);
			
			// This proves the fix: Argon2id generates a unique salt per hash,
			// so identical passwords yield different hashes.
			expect(hash1).not.toBe(hash2);
			expect(isArgon2idPasswordHash(hash1)).toBe(true);
			expect(isArgon2idPasswordHash(hash2)).toBe(true);
		});
	});

	describe("getCurrentUser", () => {
		it("returns user data for valid userId", async () => {
			const testUser = await createTestUser({
				email: "current@example.com",
				username: "currentuser",
				displayName: "Current User",
			});

			const user = await getCurrentUser(testUser.id);

			expect(user.id).toBe(testUser.id);
			expect(user.email).toBe("current@example.com");
			expect(user.username).toBe("currentuser");
			expect(user.displayName).toBe("Current User");
			expect(user.role).toBe("user");
		});

		it("throws for non-existent user", async () => {
			await expect(getCurrentUser("nonexistent-id")).rejects.toThrow("User not found");
		});
	});
});
