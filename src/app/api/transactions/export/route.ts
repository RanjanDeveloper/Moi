import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { moiTransactions, memberships } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get("eventId");
        const familyId = searchParams.get("familyId");

        const userMemberships = await db.query.memberships.findMany({
            where: eq(memberships.userId, session.user.id),
            columns: { familyId: true },
        });
        const familyIds = userMemberships.map((m) => m.familyId);

        if (familyIds.length === 0) {
            return NextResponse.json("", {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": 'attachment; filename="transactions.csv"',
                },
            });
        }

        const conditions = [];
        if (eventId) conditions.push(eq(moiTransactions.eventId, eventId));
        if (familyId && familyIds.includes(familyId)) {
            conditions.push(eq(moiTransactions.familyId, familyId));
        } else {
            conditions.push(inArray(moiTransactions.familyId, familyIds));
        }

        const results = await db.query.moiTransactions.findMany({
            where: and(...conditions),
            with: {
                event: { columns: { title: true, date: true } },
            },
        });

        // Build CSV
        const headers = ["Contributor Name", "Amount", "Direction", "Paid", "Notes", "Event", "Date"];
        const rows = results.map((t) => [
            `"${t.contributorName}"`,
            t.amount,
            t.direction,
            t.paidStatus ? "Yes" : "No",
            `"${t.notes || ""}"`,
            `"${t.event?.title || ""}"`,
            t.event?.date ? new Date(t.event.date).toISOString().split("T")[0] : "",
        ]);

        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": 'attachment; filename="moi_transactions.csv"',
            },
        });
    } catch (error) {
        console.error("Error exporting:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

