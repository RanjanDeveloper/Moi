import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { moiTransactions, memberships, contributionHistory, events } from "@/db/schema";
import { createNotification } from "@/lib/notifications";
import { eq, and, desc, asc, inArray, ilike, count } from "drizzle-orm";
import { z } from "zod";

const createTransactionSchema = z.object({
    eventId: z.string().uuid(),
    familyId: z.string().uuid(),
    contributorName: z.string().min(1, "Contributor name is required"),
    amount: z.number().positive("Amount must be positive"),
    notes: z.string().optional(),
    paidStatus: z.boolean().optional(),
    direction: z.enum(["given", "received"]),
});

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get("eventId");
        const familyId = searchParams.get("familyId");
        const search = searchParams.get("search");
        const sortBy = searchParams.get("sortBy") || "createdAt";
        const sortOrder = searchParams.get("sortOrder") || "desc";
        const direction = searchParams.get("direction");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50"); // Default 50 for backward compat
        const offset = (page - 1) * limit;

        // Get user's family IDs
        const userMemberships = await db.query.memberships.findMany({
            where: eq(memberships.userId, session.user.id),
            columns: { familyId: true },
        });
        const familyIds = userMemberships.map((m) => m.familyId);

        if (familyIds.length === 0) {
            return NextResponse.json([]);
        }

        const conditions = [];

        if (eventId) {
            conditions.push(eq(moiTransactions.eventId, eventId));
        }

        if (familyId && familyIds.includes(familyId)) {
            conditions.push(eq(moiTransactions.familyId, familyId));
        } else {
            conditions.push(inArray(moiTransactions.familyId, familyIds));
        }

        const contributorName = searchParams.get("contributorName");

        if (search) {
            conditions.push(ilike(moiTransactions.contributorName, `%${search}%`));
        }

        if (contributorName) {
            conditions.push(eq(moiTransactions.contributorName, contributorName));
        }

        if (direction === "given" || direction === "received") {
            conditions.push(eq(moiTransactions.direction, direction));
        }

        const orderFn = sortOrder === "asc" ? asc : desc;
        const orderColumn =
            sortBy === "amount"
                ? moiTransactions.amount
                : sortBy === "contributorName"
                    ? moiTransactions.contributorName
                    : moiTransactions.createdAt;

        const [totalCountRes] = await db
            .select({ count: count() })
            .from(moiTransactions)
            .where(and(...conditions));
        const total = totalCountRes.count;

        const results = await db.query.moiTransactions.findMany({
            where: and(...conditions),
            orderBy: [orderFn(orderColumn)],
            limit,
            offset,
            with: {
                event: { columns: { title: true, date: true } },
            },
        });

        return NextResponse.json({
            data: results,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validation = createTransactionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        // Check membership
        const membership = await db.query.memberships.findFirst({
            where: and(
                eq(memberships.userId, session.user.id),
                eq(memberships.familyId, validation.data.familyId)
            ),
        });

        if (!membership) {
            return NextResponse.json({ error: "Not a member" }, { status: 403 });
        }

        // Get event date to store in history
        const event = await db.query.events.findFirst({
            where: eq(events.id, validation.data.eventId),
            columns: { date: true },
        });

        const [transaction] = await db
            .insert(moiTransactions)
            .values({
                ...validation.data,
                createdBy: session.user.id,
            })
            .returning();

        // Also add to contribution history
        await db.insert(contributionHistory).values({
            familyId: validation.data.familyId,
            personName: validation.data.contributorName,
            eventId: validation.data.eventId,
            transactionId: transaction.id,
            amount: validation.data.amount,
            direction: validation.data.direction,
            date: event?.date || new Date(),
        });

        // Notify user
        const eventInfo = await db.query.events.findFirst({
            where: eq(events.id, validation.data.eventId),
            columns: { title: true },
        });
        await createNotification({
            userId: session.user.id,
            type: "general",
            title: "New Entry Added",
            message: `₹${validation.data.amount.toLocaleString("en-IN")} ${validation.data.direction} ${validation.data.direction === "received" ? "from" : "to"} ${validation.data.contributorName} in ${eventInfo?.title || "event"}`,
        });

        return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
        console.error("Error creating transaction:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

