import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { moiTransactions, memberships, events } from "@/db/schema";
import { eq, and, inArray, sql, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const familyId = searchParams.get("familyId");

        const userMemberships = await db.query.memberships.findMany({
            where: eq(memberships.userId, session.user.id),
            columns: { familyId: true },
        });
        const familyIds = userMemberships.map((m) => m.familyId);

        if (familyIds.length === 0) {
            return NextResponse.json({
                totalReceived: 0,
                totalGiven: 0,
                netBalance: 0,
                eventCount: 0,
                transactionCount: 0,
                topContributors: [],
                monthlyData: [],
            });
        }

        const targetFamilyId = familyId && familyIds.includes(familyId) ? familyId : null;
        const familyFilter = targetFamilyId
            ? eq(moiTransactions.familyId, targetFamilyId)
            : inArray(moiTransactions.familyId, familyIds);

        // Aggregate stats
        const [stats] = await db
            .select({
                totalReceived: sql<number>`COALESCE(SUM(CASE WHEN ${moiTransactions.direction} = 'received' THEN ${moiTransactions.amount} ELSE 0 END), 0)`,
                totalGiven: sql<number>`COALESCE(SUM(CASE WHEN ${moiTransactions.direction} = 'given' THEN ${moiTransactions.amount} ELSE 0 END), 0)`,
                transactionCount: sql<number>`COUNT(*)`,
            })
            .from(moiTransactions)
            .where(familyFilter);

        // Event count
        const eventFilter = targetFamilyId
            ? eq(events.familyId, targetFamilyId)
            : inArray(events.familyId, familyIds);

        const [eventStats] = await db
            .select({
                eventCount: sql<number>`COUNT(*)`,
            })
            .from(events)
            .where(eventFilter);

        // Top contributors
        const topContributors = await db
            .select({
                name: moiTransactions.contributorName,
                total: sql<number>`SUM(${moiTransactions.amount})`,
                direction: moiTransactions.direction,
            })
            .from(moiTransactions)
            .where(and(familyFilter, eq(moiTransactions.direction, "received")))
            .groupBy(moiTransactions.contributorName, moiTransactions.direction)
            .orderBy(desc(sql`SUM(${moiTransactions.amount})`))
            .limit(10);

        // Monthly data for chart
        const monthlyData = await db
            .select({
                month: sql<string>`TO_CHAR(${moiTransactions.createdAt}, 'YYYY-MM')`,
                received: sql<number>`COALESCE(SUM(CASE WHEN ${moiTransactions.direction} = 'received' THEN ${moiTransactions.amount} ELSE 0 END), 0)`,
                given: sql<number>`COALESCE(SUM(CASE WHEN ${moiTransactions.direction} = 'given' THEN ${moiTransactions.amount} ELSE 0 END), 0)`,
            })
            .from(moiTransactions)
            .where(familyFilter)
            .groupBy(sql`TO_CHAR(${moiTransactions.createdAt}, 'YYYY-MM')`)
            .orderBy(sql`TO_CHAR(${moiTransactions.createdAt}, 'YYYY-MM')`);

        return NextResponse.json({
            totalReceived: Number(stats.totalReceived),
            totalGiven: Number(stats.totalGiven),
            netBalance: Number(stats.totalReceived) - Number(stats.totalGiven),
            eventCount: Number(eventStats.eventCount),
            transactionCount: Number(stats.transactionCount),
            topContributors,
            monthlyData,
        });
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

