import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userNotifications = await db.query.notifications.findMany({
            where: eq(notifications.userId, session.user.id),
            orderBy: [desc(notifications.createdAt)],
            limit: 50,
        });

        return NextResponse.json(userNotifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { notificationId, markAllRead } = body;

        if (markAllRead) {
            await db
                .update(notifications)
                .set({ read: true })
                .where(
                    and(
                        eq(notifications.userId, session.user.id),
                        eq(notifications.read, false)
                    )
                );
            return NextResponse.json({ message: "All marked as read" });
        }

        if (notificationId) {
            await db
                .update(notifications)
                .set({ read: true })
                .where(
                    and(
                        eq(notifications.id, notificationId),
                        eq(notifications.userId, session.user.id)
                    )
                );
            return NextResponse.json({ message: "Marked as read" });
        }

        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    } catch (error) {
        console.error("Error updating notifications:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

