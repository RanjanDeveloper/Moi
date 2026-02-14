import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { families, memberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

const createFamilySchema = z.object({
    name: z.string().min(1, "Family name is required"),
    description: z.string().optional(),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userMemberships = await db.query.memberships.findMany({
            where: eq(memberships.userId, session.user.id),
            with: {
                family: true,
            },
        });

        const userFamilies = userMemberships.map((m) => ({
            ...m.family,
            role: m.role,
        }));

        return NextResponse.json(userFamilies);
    } catch (error) {
        console.error("Error fetching families:", error);
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
        const validation = createFamilySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const inviteCode = nanoid(10);

        const [family] = await db
            .insert(families)
            .values({
                name: validation.data.name,
                description: validation.data.description,
                inviteCode,
                createdBy: session.user.id,
            })
            .returning();

        // Auto-add creator as admin
        await db.insert(memberships).values({
            userId: session.user.id,
            familyId: family.id,
            role: "admin",
        });

        return NextResponse.json(family, { status: 201 });
    } catch (error) {
        console.error("Error creating family:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

