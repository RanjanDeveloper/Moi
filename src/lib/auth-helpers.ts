import { auth } from "@/lib/auth";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getSession() {
    return await auth();
}

export async function getCurrentUser() {
    const session = await getSession();
    if (!session?.user?.id) return null;
    return session.user;
}

export async function getUserFamilyIds(userId: string): Promise<string[]> {
    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, userId),
        columns: { familyId: true },
    });
    return userMemberships.map((m) => m.familyId);
}

export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("Unauthorized");
    }
    return user;
}
