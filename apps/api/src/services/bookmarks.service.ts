/**
 * @file apps/api/src/services/bookmarks.service.ts
 * @contents Domain service: database queries and business rules for bookmarks.
 * @use Called from gRPC handlers (e.g. `bookmarks.handler.ts`) and sometimes other services.
 */

import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "../db";
import { AppError } from "../grpc/errors";
import { enrichPostsWithMetrics } from "./post-metrics.service";
import { generateId } from "./utils";

const { bookmarks, posts, users } = schema;

/**
 * Toggle bookmark for a post (create if not exists, delete if exists)
 */
export async function toggleBookmark(postId: string, userId: string) {
	// Verify post exists
	const post = await db.select().from(posts).where(eq(posts.id, postId)).get();

	if (!post) {
		throw new AppError("Post not found", "NOT_FOUND");
	}

	// Check if already bookmarked
	const existingBookmark = await db
		.select()
		.from(bookmarks)
		.where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)))
		.get();

	if (existingBookmark) {
		// Remove bookmark
		await db.delete(bookmarks).where(eq(bookmarks.id, existingBookmark.id));
		return { bookmarked: false };
	} else {
		// Add bookmark
		await db.insert(bookmarks).values({
			id: generateId(),
			postId,
			userId,
		});
		return { bookmarked: true };
	}
}

/**
 * Get bookmark status for a single post
 */
export async function getBookmarkStatus(postId: string, userId: string) {
	const bookmark = await db
		.select()
		.from(bookmarks)
		.where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)))
		.get();

	return { bookmarked: !!bookmark };
}

/**
 * Get all bookmarked posts for a user with pagination
 */
export async function getBookmarkedPosts(
	userId: string,
	requesterId?: string,
	limit = 20,
	offset = 0,
) {
	// Get bookmarked post IDs
	const bookmarkedPosts = await db
		.select({
			postId: bookmarks.postId,
			bookmarkedAt: bookmarks.createdAt,
		})
		.from(bookmarks)
		.where(eq(bookmarks.userId, userId))
		.orderBy(desc(bookmarks.createdAt))
		.limit(limit)
		.offset(offset);

	if (bookmarkedPosts.length === 0) {
		return [];
	}

	const bookmarkedPostIds = bookmarkedPosts.map((bookmark) => bookmark.postId);
	const result = await db
		.select({
			id: posts.id,
			content: posts.content,
			createdAt: posts.createdAt,
			updatedAt: posts.updatedAt,
			author: {
				id: users.id,
				username: users.username,
				displayName: users.displayName,
				avatarUrl: users.avatarUrl,
			},
		})
		.from(posts)
		.leftJoin(users, eq(posts.authorId, users.id))
		.where(inArray(posts.id, bookmarkedPostIds));

	const postsWithMetrics = await enrichPostsWithMetrics(result, requesterId);
	const postById = new Map(postsWithMetrics.map((post) => [post.id, post]));

	// Preserve bookmark order from the initial query.
	return bookmarkedPostIds.flatMap((postId) => {
		const post = postById.get(postId);
		return post ? [post] : [];
	});
}
