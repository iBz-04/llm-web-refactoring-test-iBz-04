import { describe, expect, it } from "vitest";
import { createTestFollow, createTestPost, createTestUser } from "../../tests/helpers";
import { getUser, updateProfile } from "./users.service";

describe("UsersService", () => {
	it("returns a profile with counts and following status", async () => {
		const user = await createTestUser({ username: "profile-user" });
		const requester = await createTestUser({ username: "profile-requester" });
		await createTestPost(user.id, "profile post");
		await createTestFollow(requester.id, user.id);

		const profile = await getUser(user.username, requester.id);

		expect(profile.username).toBe(user.username);
		expect(profile.postCount).toBe(1);
		expect(profile.followerCount).toBe(1);
		expect(profile.isFollowing).toBe(true);
	});

	it("throws for a missing user", async () => {
		await expect(getUser("missing-user")).rejects.toThrow("User not found");
	});

	it("updates profile fields", async () => {
		const user = await createTestUser({ username: "profile-update" });

		await expect(
			updateProfile({
				userId: user.id,
				displayName: "Updated Name",
				bio: "Updated bio",
			}),
		).resolves.toEqual({ success: true });

		const updated = await getUser(user.username);
		expect(updated.displayName).toBe("Updated Name");
		expect(updated.bio).toBe("Updated bio");
	});
});
