/**
 * @file apps/client-user/src/components/shared/RelativeTime.tsx
 * @contents React UI component (RelativeTime).
 * @use Composed into client routes and layout under the same app.
 */

import { formatRelativeTime } from "../../lib/utils";

export function RelativeTime({ date }: { date: Date | number }) {
	return <span>{formatRelativeTime(date)}</span>;
}
