/**
 * @file apps/client-admin/src/lib/auth-guard.ts
 * @contents Route guard helpers for admin authentication checks.
 * @use Admin router/layout beforeLoad or similar navigation guards.
 */

import { redirect } from "@tanstack/react-router";
import { checkAdminAuth } from "../server/functions/auth";

/**
 * Auth guard for protected admin routes
 * Redirects to login if not authenticated as admin/moderator
 */
export async function requireAdminAccess() {
	const { isAuthenticated } = await checkAdminAuth();
	if (!isAuthenticated) {
		throw redirect({ to: "/login" as const });
	}
}
