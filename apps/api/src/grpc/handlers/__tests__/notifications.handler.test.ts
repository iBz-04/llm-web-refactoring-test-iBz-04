import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notificationsHandler } from "../notifications.handler";

vi.mock("../../../services/notifications.service", () => ({
	deleteNotification: vi.fn(),
	getUnreadCount: vi.fn(),
	getUserNotifications: vi.fn(),
	markAllAsRead: vi.fn(),
	markAsRead: vi.fn(),
}));

vi.mock("../../../middleware/auth", () => ({
	validateSessionToken: vi.fn(),
}));

import { validateSessionToken } from "../../../middleware/auth";
import {
	getUnreadCount,
	markAsRead,
} from "../../../services/notifications.service";

describe("NotificationsHandler", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	it("returns empty notifications when auth fails", async () => {
		vi.mocked(validateSessionToken).mockImplementation(() => {
			throw new Error("Invalid or expired session token");
		});

		const result = await notificationsHandler.getNotifications({
			sessionToken: "bad-token",
			limit: 20,
			offset: 0,
		});

		expect(result.notifications).toEqual([]);
	});

	it("returns unread count for authenticated users", async () => {
		vi.mocked(validateSessionToken).mockReturnValue({
			userId: "user-1",
			username: "tester",
			role: "user",
		});
		vi.mocked(getUnreadCount).mockResolvedValue({ count: 3 });

		const result = await notificationsHandler.getUnreadCount({
			sessionToken: "good-token",
		});

		expect(result.count).toBe(3);
		expect(getUnreadCount).toHaveBeenCalledWith("user-1");
	});

	it("returns success false when markAsRead fails", async () => {
		vi.mocked(validateSessionToken).mockReturnValue({
			userId: "user-1",
			username: "tester",
			role: "user",
		});
		vi.mocked(markAsRead).mockRejectedValue(new Error("Notification not found"));

		const result = await notificationsHandler.markAsRead({
			sessionToken: "good-token",
			notificationId: "missing-id",
		});

		expect(result.success).toBe(false);
		expect(result.error).toBe("Notification not found");
	});
});
