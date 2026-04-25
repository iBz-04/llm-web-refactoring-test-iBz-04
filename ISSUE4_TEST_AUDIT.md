# Issue 4 Audit: Test Coverage and Isolation

## Coverage Gaps Identified

Untested API services before this pass:

- `apps/api/src/services/bookmarks.service.ts`
- `apps/api/src/services/feed.service.ts`
- `apps/api/src/services/search.service.ts`
- `apps/api/src/services/users.service.ts`
- `apps/api/src/services/notifications.service.ts`

Missing handler tests before this pass:

- `apps/api/src/grpc/handlers/bookmarks.handler.ts`
- `apps/api/src/grpc/handlers/feed.handler.ts`
- `apps/api/src/grpc/handlers/follows.handler.ts`
- `apps/api/src/grpc/handlers/notifications.handler.ts`
- `apps/api/src/grpc/handlers/search.handler.ts`
- `apps/api/src/grpc/handlers/users.handler.ts`

## Helper Patterns

Helpful:

- `apps/api/tests/helpers.ts` provides compact factory helpers for users/posts/follows/likes
- client E2E helpers centralize seeded accounts and hydration waits

Risky:

- `setupDialogHandler()` in both client E2E helper files used `page.on()` with no cleanup
- `apps/client-user/playwright.config.ts` runs fully parallel against shared seeded state
- `apps/api/tests/setup.ts` manually defines schema SQL, which can drift from real schema

## Isolation Risks

- `apps/client-user/tests/e2e/notifications.comprehensive.spec.ts` mutates shared seeded users and notifications, so parallel execution can create interference
- `apps/api/tests/setup.ts` comment claimed per-file database isolation, but cleanup is actually per-test over a shared in-memory DB per worker/module graph

## Fixes Implemented

- added focused API service coverage for bookmarks, feed, notifications, and users
- added a thin uncovered handler test to verify contract-preserving behavior
- serialized the high-contention notifications comprehensive E2E suite
- upgraded dialog helpers to avoid accumulating listeners
- corrected the misleading API test setup comment
