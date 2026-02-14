import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { events, memberships } from "@/db/schema";
import { eq, and, desc, inArray, count } from "drizzle-orm";
import { z } from "zod";

const createEventSchema = z.object({
    familyId: z.string().uuid(),
    title: z.string().min(1, "Title is required"),
    type: z.enum(["wedding", "housewarming", "festival", "funeral", "custom"]),
    date: z.string(),
    location: z.string().optional(),
    description: z.string().optional(),
});

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const familyId = searchParams.get("familyId");
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
            return NextResponse.json({ data: [], meta: { total: 0, page, limit, totalPages: 0 } });
        }

        const filterFamilyId = familyId && familyIds.includes(familyId) ? familyId : null;

        const conditions = filterFamilyId
            ? eq(events.familyId, filterFamilyId)
            : inArray(events.familyId, familyIds);

        // Get total count
        const totalCountRes = await db
            .select({ count: count() })
            .from(events)
            .where(conditions);
        const total = totalCountRes[0].count;

        const eventList = await db.query.events.findMany({
            where: conditions,
            orderBy: [desc(events.date)],
            limit,
            offset,
            with: {
                family: { columns: { name: true } },
                creator: { columns: { name: true } },
            },
        });

        return NextResponse.json({
            data: eventList,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching events:", error);
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
        const validation = createEventSchema.safeParse(body);

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

        const [event] = await db
            .insert(events)
            .values({
                ...validation.data,
                date: new Date(validation.data.date),
                createdBy: session.user.id,
            })
            .returning();

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error("Error creating event:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
