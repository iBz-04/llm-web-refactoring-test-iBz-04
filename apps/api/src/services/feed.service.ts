/**
 * @file apps/api/src/services/feed.service.ts
 * @contents Domain service: database queries and business rules for feed.
 * @use Called from gRPC handlers (e.g. `feed.handler.ts`) and sometimes other services.
 */

import { desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "../db";
import { enrichPostsWithMetrics } from "./post-metrics.service";

const { posts, users, follows } = schema;

interface FeedOptions {
	limit?: number;
	offset?: number;
	userId?: string;
}

export async function getHomeFeed(userId: string, options: FeedOptions = {}) {
	const limit = options.limit || 20;
	const offset = options.offset || 0;

	// Get users that the current user follows
	const following = await db
		.select({ followingId: follows.followingId })
		.from(follows)
		.where(eq(follows.followerId, userId));

	const followingIds = following.map((f) => f.followingId);

	// Include the user's own posts as well
	const userIds = [...followingIds, userId];

	if (userIds.length === 0) {
		return [];
	}

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
		.where(inArray(posts.authorId, userIds))
		.orderBy(desc(posts.createdAt))
		.limit(limit)
		.offset(offset);

	return enrichPostsWithMetrics(result, userId);
}

export async function getExploreFeed(options: FeedOptions = {}) {
	const limit = options.limit || 20;
	const offset = options.offset || 0;

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
		.orderBy(desc(posts.createdAt))
		.limit(limit)
		.offset(offset);

	return enrichPostsWithMetrics(result, options.userId);
}
