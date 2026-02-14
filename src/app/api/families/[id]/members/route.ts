import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { memberships, users } from "@/db/schema";
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
        const userMembership = await db.query.memberships.findFirst({
            where: and(
                eq(memberships.userId, session.user.id),
                eq(memberships.familyId, id)
            ),
        });

        if (!userMembership) {
            return NextResponse.json({ error: "Not a member" }, { status: 403 });
        }

        const familyMembers = await db.query.memberships.findMany({
            where: eq(memberships.familyId, id),
            with: {
                user: {
                    columns: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        return NextResponse.json(familyMembers);
    } catch (error) {
        console.error("Error fetching members:", error);
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
        const adminMembership = await db.query.memberships.findFirst({
            where: and(
                eq(memberships.userId, session.user.id),
                eq(memberships.familyId, id)
            ),
        });

        if (!adminMembership || adminMembership.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { memberId, role } = body;

        const [updated] = await db
            .update(memberships)
            .set({ role })
            .where(
                and(eq(memberships.id, memberId), eq(memberships.familyId, id))
            )
            .returning();

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating member:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
