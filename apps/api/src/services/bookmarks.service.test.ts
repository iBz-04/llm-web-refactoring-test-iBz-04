import { describe, expect, it } from "vitest";
import { createTestLike, createTestPost, createTestUser } from "../../tests/helpers";
import { getBookmarkedPosts, getBookmarkStatus, toggleBookmark } from "./bookmarks.service";

describe("BookmarksService", () => {
	it("toggles a bookmark on and off", async () => {
		const user = await createTestUser();
		const postId = await createTestPost(user.id, "bookmark me");

		await expect(toggleBookmark(postId, user.id)).resolves.toEqual({ bookmarked: true });
		await expect(getBookmarkStatus(postId, user.id)).resolves.toEqual({ bookmarked: true });
		await expect(toggleBookmark(postId, user.id)).resolves.toEqual({ bookmarked: false });
		await expect(getBookmarkStatus(postId, user.id)).resolves.toEqual({ bookmarked: false });
	});

	it("throws when bookmarking a missing post", async () => {
		const user = await createTestUser();
		await expect(toggleBookmark("missing-post", user.id)).rejects.toThrow("Post not found");
	});

	it("returns bookmarked posts with metrics and preserved order", async () => {
		const author = await createTestUser({ username: "bookmark-author" });
		const requester = await createTestUser({ username: "bookmark-reader" });
		const olderPostId = await createTestPost(author.id, "older saved");
		const newerPostId = await createTestPost(author.id, "newer saved");
		await createTestLike(requester.id, newerPostId);

		await toggleBookmark(olderPostId, requester.id);
		await toggleBookmark(newerPostId, requester.id);

		const posts = await getBookmarkedPosts(requester.id, requester.id, 10, 0);

		expect(posts).toHaveLength(2);
		expect(posts[0].id).toBe(newerPostId);
		expect(posts[0].isLiked).toBe(true);
		expect(posts[0].likeCount).toBe(1);
		expect(posts[1].id).toBe(olderPostId);
	});
});
