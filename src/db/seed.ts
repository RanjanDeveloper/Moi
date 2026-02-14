import bcrypt from "bcryptjs";
import { db } from "./index";
import {
    users,
    families,
    memberships,
    events,
    moiTransactions,
    contributionHistory,
    notifications,
} from "./schema";
import { nanoid } from "nanoid";

async function seed() {
    console.log("🌱 Seeding database...\n");

    // ─── Users ───────────────────────────────────────
    const passwordHash = await bcrypt.hash("password123", 12);

    const [user1] = await db
        .insert(users)
        .values({
            name: "Rajan Kumar",
            email: "rajan@example.com",
            passwordHash,
        })
        .returning();

    const [user2] = await db
        .insert(users)
        .values({
            name: "Priya Devi",
            email: "priya@example.com",
            passwordHash,
        })
        .returning();

    console.log("✅ Users created");

    // ─── Family ──────────────────────────────────────
    const [family] = await db
        .insert(families)
        .values({
            name: "Kumar Family",
            description: "Our family contribution tracker",
            inviteCode: nanoid(10),
            createdBy: user1.id,
        })
        .returning();

    console.log("✅ Family created");

    // ─── Memberships ─────────────────────────────────
    await db.insert(memberships).values([
        { userId: user1.id, familyId: family.id, role: "admin" },
        { userId: user2.id, familyId: family.id, role: "member" },
    ]);

    console.log("✅ Memberships created");

    // ─── Events ──────────────────────────────────────
    const [wedding] = await db
        .insert(events)
        .values({
            familyId: family.id,
            title: "Ram's Wedding",
            type: "wedding",
            date: new Date("2025-12-15"),
            location: "Village Community Hall",
            description: "Ram's grand wedding ceremony",
            createdBy: user1.id,
            status: "open",
        })
        .returning();

    const [housewarming] = await db
        .insert(events)
        .values({
            familyId: family.id,
            title: "New House Grihapravesh",
            type: "housewarming",
            date: new Date("2025-11-01"),
            location: "Plot 42, Main Road",
            description: "Housewarming ceremony for new home",
            createdBy: user1.id,
            status: "closed",
        })
        .returning();

    const [festival] = await db
        .insert(events)
        .values({
            familyId: family.id,
            title: "Pongal Celebration 2026",
            type: "festival",
            date: new Date("2026-01-14"),
            location: "Community Ground",
            createdBy: user2.id,
            status: "open",
        })
        .returning();

    console.log("✅ Events created");

    // ─── Moi Transactions ───────────────────────────
    const contributors = [
        "Murugan", "Lakshmi", "Senthil", "Kavitha", "Pandian",
        "Meena", "Arjun", "Revathi", "Bala", "Suganya",
        "Ravi", "Uma", "Karthik", "Saroja", "Vijay",
    ];

    for (const name of contributors) {
        const amount = Math.floor(Math.random() * 4500 + 500);
        const [tx] = await db
            .insert(moiTransactions)
            .values({
                eventId: wedding.id,
                familyId: family.id,
                contributorName: name,
                amount,
                notes: `Gift from ${name}`,
                paidStatus: Math.random() > 0.5,
                direction: "received",
                createdBy: user1.id,
            })
            .returning();

        await db.insert(contributionHistory).values({
            familyId: family.id,
            personName: name,
            eventId: wedding.id,
            transactionId: tx.id,
            amount,
            direction: "received",
            date: new Date("2025-12-15"),
        });
    }

    // Add some "given" transactions for housewarming
    for (const name of contributors.slice(0, 8)) {
        const amount = Math.floor(Math.random() * 3000 + 500);
        const [tx] = await db
            .insert(moiTransactions)
            .values({
                eventId: housewarming.id,
                familyId: family.id,
                contributorName: name,
                amount,
                direction: "given",
                createdBy: user1.id,
            })
            .returning();

        await db.insert(contributionHistory).values({
            familyId: family.id,
            personName: name,
            eventId: housewarming.id,
            transactionId: tx.id,
            amount,
            direction: "given",
            date: new Date("2025-11-01"),
        });
    }

    console.log("✅ Moi transactions created");

    // ─── Notifications ───────────────────────────────
    await db.insert(notifications).values([
        {
            userId: user1.id,
            familyId: family.id,
            type: "event_reminder",
            title: "Pongal Celebration Coming Up",
            message: "Pongal Celebration 2026 is on Jan 14. Don't forget to prepare!",
        },
        {
            userId: user1.id,
            familyId: family.id,
            type: "pending_return",
            title: "Pending Returns",
            message: "You have 5 pending returns to track from Ram's Wedding.",
        },
        {
            userId: user2.id,
            familyId: family.id,
            type: "family_invite",
            title: "Welcome to Kumar Family!",
            message: "You've been added to the Kumar Family group.",
        },
    ]);

    console.log("✅ Notifications created");
    console.log("\n🎉 Seed complete!");
    console.log("───────────────────────────────");
    console.log("Login credentials:");
    console.log("  Email: rajan@example.com");
    console.log("  Password: password123");
    console.log("───────────────────────────────");

    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
