import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { favoriteEvents } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const favorites = await db.query.favoriteEvents.findMany({
            where: eq(favoriteEvents.userId, session.user.id),
            columns: { eventId: true },
        });

        return NextResponse.json(favorites.map((f) => f.eventId));
    } catch (error) {
        console.error("Error fetching favorites:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { eventId } = await req.json();
        if (!eventId) {
            return NextResponse.json({ error: "Event ID required" }, { status: 400 });
        }

        // Check if already favorited
        const existing = await db.query.favoriteEvents.findFirst({
            where: and(
                eq(favoriteEvents.userId, session.user.id),
                eq(favoriteEvents.eventId, eventId)
            ),
        });

        if (existing) {
            // Unfavorite
            await db
                .delete(favoriteEvents)
                .where(
                    and(
                        eq(favoriteEvents.userId, session.user.id),
                        eq(favoriteEvents.eventId, eventId)
                    )
                );
            return NextResponse.json({ favorited: false });
        } else {
            // Favorite
            await db.insert(favoriteEvents).values({
                userId: session.user.id,
                eventId,
            });
            return NextResponse.json({ favorited: true });
        }
    } catch (error) {
        console.error("Error toggling favorite:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
