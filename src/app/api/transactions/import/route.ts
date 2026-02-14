import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { moiTransactions, memberships, contributionHistory, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { entries, eventId, familyId } = body;

        if (!Array.isArray(entries) || entries.length === 0) {
            return NextResponse.json({ error: "No entries provided" }, { status: 400 });
        }

        // Check membership
        const membership = await db.query.memberships.findFirst({
            where: and(
                eq(memberships.userId, session.user.id),
                eq(memberships.familyId, familyId)
            ),
        });

        if (!membership) {
            return NextResponse.json({ error: "Not a member" }, { status: 403 });
        }

        const event = await db.query.events.findFirst({
            where: eq(events.id, eventId),
            columns: { date: true },
        });

        let imported = 0;
        const errors: string[] = [];

        for (const entry of entries) {
            try {
                if (!entry.contributorName || !entry.amount) {
                    errors.push(`Skipped: missing name or amount`);
                    continue;
                }

                const amount = parseInt(entry.amount);
                if (isNaN(amount) || amount <= 0) {
                    errors.push(`Skipped "${entry.contributorName}": invalid amount`);
                    continue;
                }

                const direction = entry.direction === "given" ? "given" : "received";

                const [transaction] = await db
                    .insert(moiTransactions)
                    .values({
                        eventId,
                        familyId,
                        contributorName: entry.contributorName.trim(),
                        amount,
                        notes: entry.notes || null,
                        paidStatus: entry.paidStatus === "Yes" || entry.paidStatus === true,
                        direction,
                        createdBy: session.user.id,
                    })
                    .returning();

                await db.insert(contributionHistory).values({
                    familyId,
                    personName: entry.contributorName.trim(),
                    eventId,
                    transactionId: transaction.id,
                    amount,
                    direction,
                    date: event?.date || new Date(),
                });

                imported++;
            } catch (e) {
                errors.push(`Error importing "${entry.contributorName}"`);
            }
        }

        return NextResponse.json({
            message: `Imported ${imported} entries`,
            imported,
            errors,
        });
    } catch (error) {
        console.error("Error importing:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

