# Issue 2: Query Performance Report

## Root Cause

The API had a systemic N+1 query pattern: list endpoints fetched base posts first, then ran
additional queries per post for `likeCount`, `commentCount`, and `isLiked`.

This pattern existed in:

- `apps/api/src/services/feed.service.ts`
- `apps/api/src/services/posts.service.ts`
- `apps/api/src/services/search.service.ts`
- `apps/api/src/services/bookmarks.service.ts`

## Reusable Fix Pattern

Added `apps/api/src/services/post-metrics.service.ts` with shared batching helpers:

- `getPostMetricsByPostIds(postIds, userId?)`
- `enrichPostsWithMetrics(posts, userId?)`

The utility performs set-based aggregation:

1. grouped like counts for all post IDs in one query
2. grouped comment counts for all post IDs in one query
3. requester like-status for all post IDs in one query

This prevents future per-post query loops.

## Query Counts (Before -> After)

Assumptions used for profiling:

- authenticated requester (so `isLiked` is evaluated)
- home feed returns 10 posts
- bookmarks page returns 10 bookmarked posts
- profile page load includes 10 user posts

### 1) Home Feed (10 posts)

- **Before:** 32 queries
  - 1 follows lookup
  - 1 feed posts query
  - 30 post-metrics queries (3 x 10)
- **After:** 5 queries
  - 1 follows lookup
  - 1 feed posts query
  - 1 grouped likes query
  - 1 grouped comments query
  - 1 batched liked-status query

### 2) User Profile Page Load

This page originally called 5 RPCs (`getUser`, `getUserPosts`, `getCurrentUser`, `getFollowerCount`, `getFollowingCount`), even though `getUser` already returns follower/following counts.

- **Before:** 42 queries
  - `users.getUser`: 5
  - `posts.getUserPosts` (10 posts): 32
  - `auth.getCurrentUser`: 1
  - `follows.getFollowerCount`: 2
  - `follows.getFollowingCount`: 2
- **After:** 11 queries
  - `users.getUser`: 5
  - `posts.getUserPosts` (10 posts, batched metrics): 5
  - `auth.getCurrentUser`: 1

### 3) Bookmarks Page (10 bookmarked posts)

- **Before:** 41 queries
  - 1 bookmarked IDs query
  - 40 per-post queries (post details + like count + comment count + isLiked) x 10
- **After:** 5 queries
  - 1 bookmarked IDs query
  - 1 batched post details query
  - 1 grouped likes query
  - 1 grouped comments query
  - 1 batched liked-status query

## Response Contract Safety

No response shape changes were introduced in the API handlers. The refactor only changes
how data is fetched internally (set-based batching instead of per-post loops).

## Additional Fixes

- Removed unused test fixtures (`TEST_USERS`, `badge`, `forgedToken`)
- Fixed type mismatch in `client-admin` users list (status check logic)
- Added missing banned user to mock data for type completeness
