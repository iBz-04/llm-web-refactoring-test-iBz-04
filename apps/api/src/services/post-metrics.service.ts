/**
 * @file apps/api/src/services/post-metrics.service.ts
 * @contents Shared batching utilities for post-level like/comment metrics.
 * @use Imported by feed/posts/search/bookmarks services to avoid N+1 queries.
 */

import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "../db";

const { likes, comments } = schema;

export interface PostMetrics {
	likeCount: number;
	commentCount: number;
	isLiked: boolean;
}

function toCountMap(rows: Array<{ postId: string | null; count: number }>) {
	const map = new Map<string, number>();
	for (const row of rows) {
		if (!row.postId) continue;
		map.set(row.postId, row.count || 0);
	}
	return map;
}

export async function getPostMetricsByPostIds(postIds: string[], userId?: string) {
	if (postIds.length === 0) {
		return new Map<string, PostMetrics>();
	}

	const [likeCountRows, commentCountRows, likedRows] = await Promise.all([
		db
			.select({
				postId: likes.postId,
				count: sql<number>`count(*)`,
			})
			.from(likes)
			.where(inArray(likes.postId, postIds))
			.groupBy(likes.postId),
		db
			.select({
				postId: comments.postId,
				count: sql<number>`count(*)`,
			})
			.from(comments)
			.where(inArray(comments.postId, postIds))
			.groupBy(comments.postId),
		userId
			? db
					.select({
						postId: likes.postId,
					})
					.from(likes)
					.where(and(eq(likes.userId, userId), inArray(likes.postId, postIds)))
			: Promise.resolve([] as Array<{ postId: string | null }>),
	]);

	const likeCounts = toCountMap(likeCountRows);
	const commentCounts = toCountMap(commentCountRows);
	const likedPostIds = new Set(
		likedRows
			.map((row) => row.postId)
			.filter((postId): postId is string => Boolean(postId)),
	);

	const metricsByPostId = new Map<string, PostMetrics>();
	for (const postId of postIds) {
		metricsByPostId.set(postId, {
			likeCount: likeCounts.get(postId) || 0,
			commentCount: commentCounts.get(postId) || 0,
			isLiked: likedPostIds.has(postId),
		});
	}

	return metricsByPostId;
}

export async function enrichPostsWithMetrics<T extends { id: string }>(
	posts: T[],
	userId?: string,
): Promise<Array<T & PostMetrics>> {
	const postIds = posts.map((post) => post.id);
	const metricsByPostId = await getPostMetricsByPostIds(postIds, userId);

	return posts.map((post) => ({
		...post,
		...(metricsByPostId.get(post.id) || {
			likeCount: 0,
			commentCount: 0,
			isLiked: false,
		}),
	}));
}
