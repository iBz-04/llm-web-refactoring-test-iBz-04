/**
 * @file apps/api/src/db/index.ts
 * @contents Drizzle ORM client wired to libSQL; exports `db` and `schema`.
 * @use Imported across API services, seed script, and tests.
 */

import * as schema from "@chirp/db-schema";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const client = createClient({
	url: process.env.DATABASE_URL || "file:./chirp.db",
});

export const db = drizzle(client, { schema });

export { schema };
