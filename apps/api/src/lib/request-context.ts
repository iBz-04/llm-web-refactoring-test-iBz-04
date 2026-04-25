/**
 * @file apps/api/src/lib/request-context.ts
 * @contents Request-scoped trace context for gRPC calls.
 */

import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContextStore {
	traceId: string;
	method: string;
	service: string;
	startedAt: number;
}

const storage = new AsyncLocalStorage<RequestContextStore>();

export function runWithRequestContext<T>(
	context: RequestContextStore,
	callback: () => T | Promise<T>,
): T | Promise<T> {
	return storage.run(context, callback);
}

export function getRequestContext(): RequestContextStore | undefined {
	return storage.getStore();
}

export function createTraceId() {
	return `trace_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
