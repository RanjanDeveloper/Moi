import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { moiTransactions, memberships } from "@/db/schema";
import { eq, and, ilike, inArray, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const familyId = searchParams.get("familyId");

        // Get user's family memberships
        const userMemberships = await db.query.memberships.findMany({
            where: eq(memberships.userId, session.user.id),
            columns: { familyId: true },
        });
        const familyIds = userMemberships.map((m) => m.familyId);

        if (familyIds.length === 0) {
            return NextResponse.json([]);
        }

        const conditions = [];

        // Scope to user families
        if (familyId && familyIds.includes(familyId)) {
            conditions.push(eq(moiTransactions.familyId, familyId));
        } else {
            conditions.push(inArray(moiTransactions.familyId, familyIds));
        }

        // Search filter
        if (search) {
            conditions.push(ilike(moiTransactions.contributorName, `%${search}%`));
        }

        // Fetch distinct names
        const results = await db
            .select({
                name: moiTransactions.contributorName,
            })
            .from(moiTransactions)
            .where(and(...conditions))
            .groupBy(moiTransactions.contributorName)
            .orderBy(moiTransactions.contributorName)
            .limit(10); // Limit suggestion count

        return NextResponse.json(results.map((r) => r.name));
    } catch (error) {
        console.error("Error fetching contributors:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
