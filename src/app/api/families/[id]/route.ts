import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { families, memberships } from "@/db/schema";
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

        // Check membership
        const membership = await db.query.memberships.findFirst({
            where: and(
                eq(memberships.userId, session.user.id),
                eq(memberships.familyId, id)
            ),
        });

        if (!membership) {
            return NextResponse.json({ error: "Not a member" }, { status: 403 });
        }

        const family = await db.query.families.findFirst({
            where: eq(families.id, id),
        });

        return NextResponse.json({ ...family, role: membership.role });
    } catch (error) {
        console.error("Error fetching family:", error);
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

        // Check if admin
        const membership = await db.query.memberships.findFirst({
            where: and(
                eq(memberships.userId, session.user.id),
                eq(memberships.familyId, id)
            ),
        });

        if (!membership || membership.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const [updated] = await db
            .update(families)
            .set({
                name: body.name,
                description: body.description,
            })
            .where(eq(families.id, id))
            .returning();

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating family:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
