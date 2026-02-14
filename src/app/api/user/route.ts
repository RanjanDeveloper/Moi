import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [user] = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(eq(users.id, session.user.id));

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, currentPassword, newPassword } = body;

        // Update name
        if (name && typeof name === "string" && name.trim().length >= 2) {
            await db
                .update(users)
                .set({ name: name.trim() })
                .where(eq(users.id, session.user.id));
        }

        // Change password
        if (currentPassword && newPassword) {
            if (newPassword.length < 6) {
                return NextResponse.json(
                    { error: "New password must be at least 6 characters" },
                    { status: 400 }
                );
            }

            const [user] = await db
                .select({ passwordHash: users.passwordHash })
                .from(users)
                .where(eq(users.id, session.user.id));

            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            const valid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!valid) {
                return NextResponse.json(
                    { error: "Current password is incorrect" },
                    { status: 400 }
                );
            }

            const newHash = await bcrypt.hash(newPassword, 12);
            await db
                .update(users)
                .set({ passwordHash: newHash })
                .where(eq(users.id, session.user.id));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
