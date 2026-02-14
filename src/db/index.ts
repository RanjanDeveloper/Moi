import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
    prepare: false,
    ssl: { rejectUnauthorized: false },
    connection: {
        options: `-c search_path=public`,
    },
    idle_timeout: 20,
    max: 1,
});

export const db = drizzle(client, { schema });
