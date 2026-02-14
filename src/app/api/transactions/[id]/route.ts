import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { moiTransactions, memberships, contributionHistory } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const transaction = await db.query.moiTransactions.findFirst({
            where: eq(moiTransactions.id, id),
            with: {
                event: { columns: { title: true } },
            },
        });

        if (!transaction) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json(transaction);
    } catch (error) {
        console.error("Error fetching transaction:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        const existing = await db.query.moiTransactions.findFirst({
            where: eq(moiTransactions.id, id),
        });

        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const membership = await db.query.memberships.findFirst({
            where: and(
                eq(memberships.userId, session.user.id),
                eq(memberships.familyId, existing.familyId)
            ),
        });

        if (!membership) {
            return NextResponse.json({ error: "Not a member" }, { status: 403 });
        }

        const [updated] = await db
            .update(moiTransactions)
            .set({
                contributorName: body.contributorName,
                amount: body.amount,
                notes: body.notes,
                paidStatus: body.paidStatus,
                direction: body.direction,
                updatedAt: new Date(),
            })
            .where(eq(moiTransactions.id, id))
            .returning();

        // Update contribution history too
        await db
            .update(contributionHistory)
            .set({
                personName: body.contributorName,
                amount: body.amount,
                direction: body.direction,
            })
            .where(eq(contributionHistory.transactionId, id));

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating transaction:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const existing = await db.query.moiTransactions.findFirst({
            where: eq(moiTransactions.id, id),
        });

        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const membership = await db.query.memberships.findFirst({
            where: and(
                eq(memberships.userId, session.user.id),
                eq(memberships.familyId, existing.familyId)
            ),
        });

        if (!membership) {
            return NextResponse.json({ error: "Not a member" }, { status: 403 });
        }

        // Delete history first (cascade should handle it, but be safe)
        await db
            .delete(contributionHistory)
            .where(eq(contributionHistory.transactionId, id));

        await db.delete(moiTransactions).where(eq(moiTransactions.id, id));

        return NextResponse.json({ message: "Deleted" });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
