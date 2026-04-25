/**
 * @file apps/api/src/lib/logger.ts
 * @contents Minimal structured logger for API observability.
 */

import { getRequestContext } from "./request-context";

type Level = "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

function write(level: Level, event: string, fields: LogFields = {}) {
	const request = getRequestContext();
	const payload = {
		level,
		event,
		timestamp: new Date().toISOString(),
		traceId: request?.traceId,
		service: request?.service,
		method: request?.method,
		...fields,
	};
	const line = JSON.stringify(payload);
	if (level === "error") {
		console.error(line);
		return;
	}
	console.log(line);
}

export const logger = {
	info(event: string, fields?: LogFields) {
		write("info", event, fields);
	},
	warn(event: string, fields?: LogFields) {
		write("warn", event, fields);
	},
	error(event: string, fields?: LogFields) {
		write("error", event, fields);
	},
};
