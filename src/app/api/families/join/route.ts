import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { families, memberships, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";

const joinSchema = z.object({
    inviteCode: z.string().min(1, "Invite code is required"),
});

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validation = joinSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const family = await db.query.families.findFirst({
            where: eq(families.inviteCode, validation.data.inviteCode),
        });

        if (!family) {
            return NextResponse.json(
                { error: "Invalid invite code" },
                { status: 404 }
            );
        }

        // Check if already a member
        const existing = await db.query.memberships.findFirst({
            where: and(
                eq(memberships.userId, session.user.id),
                eq(memberships.familyId, family.id)
            ),
        });

        if (existing) {
            return NextResponse.json(
                { error: "Already a member of this family" },
                { status: 409 }
            );
        }

        await db.insert(memberships).values({
            userId: session.user.id,
            familyId: family.id,
            role: "member",
        });

        // Notify family creator
        const joiner = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            columns: { name: true },
        });
        await createNotification({
            userId: family.createdBy,
            type: "family_invite",
            title: "New Family Member",
            message: `${joiner?.name || "Someone"} joined ${family.name}`,
        });

        return NextResponse.json(
            { message: "Successfully joined family", family },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error joining family:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

