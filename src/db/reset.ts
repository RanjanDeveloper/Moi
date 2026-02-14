import { db } from "./index";
import { moiTransactions, events, memberships, families, notifications, users } from "./schema";
import { sql } from "drizzle-orm";

async function reset() {
    console.log("🗑️  Clearing all data...\n");

    // Delete in order to respect foreign key constraints
    await db.delete(notifications);
    console.log("  ✓ Notifications cleared");

    await db.delete(moiTransactions);
    console.log("  ✓ Transactions cleared");

    await db.delete(events);
    console.log("  ✓ Events cleared");

    await db.delete(memberships);
    console.log("  ✓ Memberships cleared");

    await db.delete(families);
    console.log("  ✓ Families cleared");

    await db.delete(users);
    console.log("  ✓ Users cleared");

    console.log("\n✅ Database reset complete!");
    process.exit(0);
}

reset().catch((err) => {
    console.error("❌ Reset failed:", err);
    process.exit(1);
});
