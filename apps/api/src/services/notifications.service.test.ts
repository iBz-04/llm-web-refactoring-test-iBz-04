import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db, schema } from "../db";
import { createTestPost, createTestUser } from "../../tests/helpers";
import {
	createNotification,
	deleteNotification,
	getUnreadCount,
	markAsRead,
} from "./notifications.service";

const { notifications } = schema;

describe("NotificationsService", () => {
	it("does not create self-notifications", async () => {
		const user = await createTestUser();
		await expect(
			createNotification({
				userId: user.id,
				actorId: user.id,
				type: "follow",
			}),
		).resolves.toBeNull();
	});

	it("marks notifications as read and returns unread count", async () => {
		const recipient = await createTestUser({ username: "notif-recipient" });
		const actor = await createTestUser({ username: "notif-actor" });
		const postId = await createTestPost(recipient.id, "notify me");
		const created = await createNotification({
			userId: recipient.id,
			actorId: actor.id,
			type: "like",
			postId,
		});

		expect(created).not.toBeNull();
		await expect(getUnreadCount(recipient.id)).resolves.toEqual({ count: 1 });
		await expect(markAsRead(created!.notificationId, recipient.id)).resolves.toEqual({
			success: true,
		});
		await expect(getUnreadCount(recipient.id)).resolves.toEqual({ count: 0 });
	});

	it("throws when marking another users notification as read", async () => {
		const recipient = await createTestUser({ username: "notif-owner" });
		const actor = await createTestUser({ username: "notif-sender" });
		const otherUser = await createTestUser({ username: "notif-other" });
		const created = await createNotification({
			userId: recipient.id,
			actorId: actor.id,
			type: "follow",
		});

		await expect(markAsRead(created!.notificationId, otherUser.id)).rejects.toThrow(
			"Unauthorized",
		);
	});

	it("throws for missing notification deletion", async () => {
		const user = await createTestUser();
		await expect(deleteNotification("missing-notification", user.id)).rejects.toThrow(
			"Notification not found",
		);
	});

	it("deletes owned notifications", async () => {
		const recipient = await createTestUser({ username: "notif-delete-owner" });
		const actor = await createTestUser({ username: "notif-delete-actor" });
		const created = await createNotification({
			userId: recipient.id,
			actorId: actor.id,
			type: "follow",
		});

		await expect(deleteNotification(created!.notificationId, recipient.id)).resolves.toEqual({
			success: true,
		});

		const deleted = await db
			.select()
			.from(notifications)
			.where(eq(notifications.id, created!.notificationId))
			.get();
		expect(deleted).toBeUndefined();
	});
});
