import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { events, memberships, moiTransactions } from "@/db/schema";
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

        const event = await db.query.events.findFirst({
            where: eq(events.id, id),
            with: {
                family: { columns: { id: true, name: true } },
                creator: { columns: { name: true } },
                transactions: true,
            },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // Verify membership
        const membership = await db.query.memberships.findFirst({
            where: and(
                eq(memberships.userId, session.user.id),
                eq(memberships.familyId, event.familyId)
            ),
        });

        if (!membership) {
            return NextResponse.json({ error: "Not a member" }, { status: 403 });
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error("Error fetching event:", error);
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

        const event = await db.query.events.findFirst({
            where: eq(events.id, id),
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const membership = await db.query.memberships.findFirst({
            where: and(
                eq(memberships.userId, session.user.id),
                eq(memberships.familyId, event.familyId)
            ),
        });

        if (!membership) {
            return NextResponse.json({ error: "Not a member" }, { status: 403 });
        }

        const [updated] = await db
            .update(events)
            .set({
                title: body.title,
                type: body.type,
                date: body.date ? new Date(body.date) : undefined,
                location: body.location,
                description: body.description,
                status: body.status,
                updatedAt: new Date(),
            })
            .where(eq(events.id, id))
            .returning();

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating event:", error);
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

        const event = await db.query.events.findFirst({
            where: eq(events.id, id),
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const membership = await db.query.memberships.findFirst({
            where: and(
                eq(memberships.userId, session.user.id),
                eq(memberships.familyId, event.familyId)
            ),
        });

        if (!membership || membership.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        await db.delete(events).where(eq(events.id, id));

        return NextResponse.json({ message: "Event deleted" });
    } catch (error) {
        console.error("Error deleting event:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
