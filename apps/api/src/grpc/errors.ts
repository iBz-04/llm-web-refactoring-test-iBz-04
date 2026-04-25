/**
 * @file apps/api/src/grpc/errors.ts
 * @contents Shared application error taxonomy and gRPC mapping.
 */

import { RpcError } from "@protobuf-ts/runtime-rpc";

export type AppErrorCode =
	| "UNAUTHENTICATED"
	| "PERMISSION_DENIED"
	| "INVALID_ARGUMENT"
	| "NOT_FOUND"
	| "ALREADY_EXISTS"
	| "FAILED_PRECONDITION"
	| "INTERNAL";

export class AppError extends Error {
	constructor(
		message: string,
		public readonly code: AppErrorCode,
		public readonly details?: Record<string, unknown>,
	) {
		super(message);
		this.name = "AppError";
	}
}

export function isAppError(error: unknown): error is AppError {
	return error instanceof AppError;
}

export function toAppError(error: unknown, fallbackMessage = "Internal server error"): AppError {
	if (error instanceof AppError) {
		return error;
	}
	if (error instanceof Error) {
		return new AppError(error.message, "INTERNAL");
	}
	return new AppError(fallbackMessage, "INTERNAL");
}

export function toRpcError(error: AppError, traceId: string) {
	return new RpcError(error.message, error.code, { "x-trace-id": traceId });
}
