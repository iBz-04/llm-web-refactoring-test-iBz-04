/**
 * @file apps/api/src/grpc/wrap-handler.ts
 * @contents Central request tracing, logging, and thrown-error mapping for gRPC handlers.
 */

import type { ServerCallContext } from "@protobuf-ts/runtime-rpc";
import { logger } from "../lib/logger";
import { createTraceId, runWithRequestContext } from "../lib/request-context";
import { isAppError, toAppError, toRpcError } from "./errors";

type HandlerMap = Record<string, (request: unknown, context?: ServerCallContext) => Promise<unknown>>;

export function wrapHandler<T extends HandlerMap>(serviceName: string, handler: T): T {
	const wrappedEntries = Object.entries(handler).map(([methodName, method]) => {
		const wrapped = async (request: unknown, context?: ServerCallContext) => {
			const traceId = createTraceId();
			if (context) {
				context.sendResponseHeaders({ "x-trace-id": traceId });
				context.trailers = {
					...context.trailers,
					"x-trace-id": traceId,
				};
			}

			return runWithRequestContext(
				{
					traceId,
					method: methodName,
					service: serviceName,
					startedAt: Date.now(),
				},
				async () => {
					logger.info("grpc.request.start");
					const startedAt = Date.now();
					try {
						const response = await method(request, context);
						logger.info("grpc.request.finish", {
							durationMs: Date.now() - startedAt,
							outcome: "ok",
						});
						return response;
					} catch (error) {
						const appError = toAppError(error);
						logger.error("grpc.request.error", {
							durationMs: Date.now() - startedAt,
							outcome: "error",
							errorCode: appError.code,
							errorMessage: appError.message,
						});
						if (isAppError(error)) {
							throw toRpcError(error, traceId);
						}
						throw toRpcError(appError, traceId);
					}
				},
			);
		};

		return [methodName, wrapped];
	});

	return Object.fromEntries(wrappedEntries) as T;
}
