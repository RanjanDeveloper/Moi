import { db } from "@/db";
import { notifications } from "@/db/schema";

type NotificationType = "event_reminder" | "pending_return" | "family_invite" | "general";

export async function createNotification({
    userId,
    type = "general",
    title,
    message,
}: {
    userId: string;
    type?: NotificationType;
    title: string;
    message: string;
}) {
    try {
        await db.insert(notifications).values({
            userId,
            type,
            title,
            message,
        });
    } catch (error) {
        console.error("Failed to create notification:", error);
    }
}
