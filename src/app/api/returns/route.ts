import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { contributionHistory, memberships } from "@/db/schema";
import { eq, and, inArray, sql, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const familyId = searchParams.get("familyId");

        // Pagination params
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const offset = (page - 1) * limit;

        const userMemberships = await db.query.memberships.findMany({
            where: eq(memberships.userId, session.user.id),
            columns: { familyId: true },
        });
        const familyIds = userMemberships.map((m) => m.familyId);

        if (familyIds.length === 0) {
            return NextResponse.json([]);
        }

        const targetFamilyId = familyId && familyIds.includes(familyId) ? familyId : null;
        const familyFilter = targetFamilyId
            ? eq(contributionHistory.familyId, targetFamilyId)
            : inArray(contributionHistory.familyId, familyIds);

        // Get total count for pagination metadata
        const totalCountResult = await db
            .select({ count: sql<number>`COUNT(DISTINCT ${contributionHistory.personName})` })
            .from(contributionHistory)
            .where(familyFilter);

        const total = Number(totalCountResult[0]?.count || 0);

        // Get aggregated contributions per person with pagination
        const results = await db
            .select({
                personName: contributionHistory.personName,
                totalReceived: sql<number>`COALESCE(SUM(CASE WHEN ${contributionHistory.direction} = 'received' THEN ${contributionHistory.amount} ELSE 0 END), 0)`,
                totalGiven: sql<number>`COALESCE(SUM(CASE WHEN ${contributionHistory.direction} = 'given' THEN ${contributionHistory.amount} ELSE 0 END), 0)`,
                netBalance: sql<number>`COALESCE(SUM(CASE WHEN ${contributionHistory.direction} = 'received' THEN ${contributionHistory.amount} ELSE -${contributionHistory.amount} END), 0)`,
                lastInteraction: sql<string>`MAX(${contributionHistory.date})`,
                eventCount: sql<number>`COUNT(DISTINCT ${contributionHistory.eventId})`,
            })
            .from(contributionHistory)
            .where(familyFilter)
            .groupBy(contributionHistory.personName)
            .orderBy(desc(sql`MAX(${contributionHistory.date})`))
            .limit(limit)
            .offset(offset);

        // Get per-person history timeline
        const enrichedResults = await Promise.all(
            results.map(async (person) => {
                const timeline = await db.query.contributionHistory.findMany({
                    where: and(
                        familyFilter,
                        eq(contributionHistory.personName, person.personName)
                    ),
                    orderBy: [desc(contributionHistory.date)],
                    with: {
                        event: { columns: { title: true, type: true } },
                    },
                });

                return {
                    ...person,
                    suggestedReturn:
                        Number(person.totalReceived) - Number(person.totalGiven),
                    timeline,
                };
            })
        );

        return NextResponse.json({
            data: enrichedResults,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching returns:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

