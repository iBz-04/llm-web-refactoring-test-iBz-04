/**
 * @file apps/api/src/services/search.service.ts
 * @contents Domain service: database queries and business rules for search.
 * @use Called from gRPC handlers (e.g. `search.handler.ts`) and sometimes other services.
 */

import { desc, eq, like, or } from "drizzle-orm";
import { db, schema } from "../db";
import { enrichPostsWithMetrics } from "./post-metrics.service";

const { posts, users } = schema;

export async function searchPosts(query: string, userId?: string) {
	if (!query || query.trim().length === 0) {
		return [];
	}

	const searchPattern = `%${query}%`;

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
		.where(like(posts.content, searchPattern))
		.orderBy(desc(posts.createdAt))
		.limit(50);

	return enrichPostsWithMetrics(result, userId);
}

export async function searchUsers(query: string) {
	if (!query || query.trim().length === 0) {
		return [];
	}

	const searchPattern = `%${query}%`;

	const result = await db
		.select({
			id: users.id,
			username: users.username,
			displayName: users.displayName,
			avatarUrl: users.avatarUrl,
			bio: users.bio,
		})
		.from(users)
		.where(or(like(users.username, searchPattern), like(users.displayName, searchPattern)))
		.limit(20);

	return result;
}
