# Issue 3 Audit: Error Handling and Observability

## Current Handler Strategies

- `success: false` payload responses for write operations:
  - `apps/api/src/grpc/handlers/auth.handler.ts`
  - `apps/api/src/grpc/handlers/posts.handler.ts`
  - `apps/api/src/grpc/handlers/comments.handler.ts`
  - `apps/api/src/grpc/handlers/likes.handler.ts`
  - `apps/api/src/grpc/handlers/follows.handler.ts`
  - `apps/api/src/grpc/handlers/users.handler.ts`
  - `apps/api/src/grpc/handlers/bookmarks.handler.ts`
  - `apps/api/src/grpc/handlers/notifications.handler.ts`
  - `apps/api/src/grpc/handlers/admin.handler.ts`

- Optional-auth public fallback:
  - `apps/api/src/grpc/handlers/feed.handler.ts`
  - `apps/api/src/grpc/handlers/posts.handler.ts`
  - `apps/api/src/grpc/handlers/comments.handler.ts`
  - `apps/api/src/grpc/handlers/search.handler.ts`
  - `apps/api/src/grpc/handlers/users.handler.ts`

- Swallow-and-default behavior:
  - `apps/api/src/grpc/handlers/notifications.handler.ts`
  - `apps/api/src/grpc/handlers/bookmarks.handler.ts`
  - `apps/api/src/grpc/handlers/follows.handler.ts`
  - `apps/api/src/grpc/handlers/likes.handler.ts`

- Uncaught thrown-error paths:
  - `apps/api/src/grpc/handlers/feed.handler.ts`
  - read-only admin methods in `apps/api/src/grpc/handlers/admin.handler.ts`
  - `apps/api/src/grpc/handlers/auth.handler.ts#getCurrentUser`

## Implemented Taxonomy

- `UNAUTHENTICATED`
- `PERMISSION_DENIED`
- `INVALID_ARGUMENT`
- `NOT_FOUND`
- `ALREADY_EXISTS`
- `FAILED_PRECONDITION`
- `INTERNAL`

Implemented in `apps/api/src/grpc/errors.ts` via `AppError`.

## gRPC Status Mapping

Thrown `AppError`s are converted to `RpcError` at the gRPC boundary in
`apps/api/src/grpc/wrap-handler.ts`, which `@protobuf-ts/grpc-backend`
maps to gRPC status codes.

- `UNAUTHENTICATED` -> gRPC unauthenticated
- `PERMISSION_DENIED` -> gRPC permission denied
- `INVALID_ARGUMENT` -> gRPC invalid argument
- `NOT_FOUND` -> gRPC not found
- `ALREADY_EXISTS` -> gRPC already exists
- `FAILED_PRECONDITION` -> gRPC failed precondition
- `INTERNAL` -> gRPC internal

## Observability Added

- Request-scoped trace IDs via `AsyncLocalStorage` in `apps/api/src/lib/request-context.ts`
- Structured JSON logging in `apps/api/src/lib/logger.ts`
- Central request start/finish/error logs in `apps/api/src/grpc/wrap-handler.ts`
- Trace ID returned in gRPC response metadata (`x-trace-id`) and trailers

## Contract Preservation

Existing protobuf body contracts were preserved:

- in-band `success: false`
- in-band `valid: false`
- existing empty-list / false / zero fallbacks

The new shared boundary only affects:

- structured logs
- trace metadata
- uncaught thrown-error paths
