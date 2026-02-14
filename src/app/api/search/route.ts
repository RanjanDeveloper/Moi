import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { events, moiTransactions, memberships } from "@/db/schema";
import { and, eq, ilike, inArray, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const query = url.searchParams.get("q")?.trim();

        if (!query || query.length < 2) {
            return NextResponse.json({ events: [], contributors: [] });
        }

        // Get user's family IDs
        const userMemberships = await db
            .select({ familyId: memberships.familyId })
            .from(memberships)
            .where(eq(memberships.userId, session.user.id));

        const familyIds = userMemberships.map((m) => m.familyId);
        if (familyIds.length === 0) {
            return NextResponse.json({ events: [], contributors: [] });
        }

        const pattern = `%${query}%`;

        // Search events
        const matchedEvents = await db
            .select({
                id: events.id,
                title: events.title,
                type: events.type,
                date: events.date,
                status: events.status,
            })
            .from(events)
            .where(
                and(
                    inArray(events.familyId, familyIds),
                    or(
                        ilike(events.title, pattern),
                        ilike(events.location, pattern)
                    )
                )
            )
            .limit(5);

        // Search contributors
        const matchedContributors = await db
            .select({
                contributorName: moiTransactions.contributorName,
                eventId: moiTransactions.eventId,
                amount: moiTransactions.amount,
                direction: moiTransactions.direction,
            })
            .from(moiTransactions)
            .where(
                and(
                    inArray(moiTransactions.familyId, familyIds),
                    ilike(moiTransactions.contributorName, pattern)
                )
            )
            .limit(10);

        // Deduplicate contributors by name
        const uniqueContributors = Array.from(
            new Map(
                matchedContributors.map((c) => [c.contributorName.toLowerCase(), c])
            ).values()
        ).slice(0, 5);

        return NextResponse.json({
            events: matchedEvents,
            contributors: uniqueContributors,
        });
    } catch (error) {
        console.error("Error searching:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
