import { describe, expect, it } from "vitest";
import { createTestFollow, createTestPost, createTestUser } from "../../tests/helpers";
import { getExploreFeed, getHomeFeed } from "./feed.service";

describe("FeedService", () => {
	it("returns own and followed users posts in the home feed", async () => {
		const viewer = await createTestUser({ username: "viewer" });
		const followed = await createTestUser({ username: "followed" });
		const outsider = await createTestUser({ username: "outsider" });

		await createTestFollow(viewer.id, followed.id);
		await createTestPost(viewer.id, "viewer post");
		await createTestPost(followed.id, "followed post");
		await createTestPost(outsider.id, "outsider post");

		const feed = await getHomeFeed(viewer.id, { limit: 10 });

		expect(feed).toHaveLength(2);
		expect(feed.map((post) => post.content)).toEqual(
			expect.arrayContaining(["viewer post", "followed post"]),
		);
		expect(feed.map((post) => post.content)).not.toContain("outsider post");
	});

	it("returns the global explore feed in reverse chronological order", async () => {
		const firstUser = await createTestUser({ username: "explore-first" });
		const secondUser = await createTestUser({ username: "explore-second" });
		await createTestPost(firstUser.id, "first explore post");
		await createTestPost(secondUser.id, "second explore post");

		const feed = await getExploreFeed({ limit: 10 });

		expect(feed).toHaveLength(2);
		expect(feed[0].content).toBe("second explore post");
		expect(feed[1].content).toBe("first explore post");
	});
});
