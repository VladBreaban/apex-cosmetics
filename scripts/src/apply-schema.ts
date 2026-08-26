import pg from "pg";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { Client } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQL_FILE = path.join(
  __dirname,
  "..",
  "..",
  "lib",
  "db",
  "drizzle",
  "0000_init.sql",
);

/**
 * Apply the Drizzle baseline schema to a database, additively.
 *
 * `drizzle-kit push` diffs and can drop or alter existing objects; this only
 * ever creates what is missing, which is what a deployed database needs. Every
 * statement is rewritten to be conditional, so running it against a database
 * that is already up to date is a no-op.
 *
 * Regenerate the baseline after a schema change with:
 *   drizzle-kit generate --dialect postgresql --schema ./src/schema/index.ts --out ./drizzle
 */
function makeIdempotent(statement: string): string {
  const trimmed = statement.trim();

  if (/^CREATE TABLE "/i.test(trimmed)) {
    return trimmed.replace(/^CREATE TABLE /i, "CREATE TABLE IF NOT EXISTS ");
  }

  if (/^CREATE (UNIQUE )?INDEX "/i.test(trimmed)) {
    return trimmed.replace(
      /^CREATE (UNIQUE )?INDEX /i,
      (_m, unique) => `CREATE ${unique ?? ""}INDEX IF NOT EXISTS `,
    );
  }

  // Named constraints have no IF NOT EXISTS form, so guard on pg_constraint.
  const constraint = trimmed.match(/ADD CONSTRAINT "([^"]+)"/i);
  if (/^ALTER TABLE /i.test(trimmed) && constraint) {
    const name = constraint[1];
    return `DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN
    ${trimmed.replace(/;$/, "")};
  END IF;
END
$$`;
  }

  return trimmed;
}

async function apply() {
  const sql = await readFile(SQL_FILE, "utf8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(makeIdempotent);

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const before = await client.query(
      `SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'`,
    );

    await client.query("BEGIN");
    for (const statement of statements) {
      await client.query(statement);
    }
    await client.query("COMMIT");

    const after = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' ORDER BY table_name`,
    );

    console.log(
      `Applied ${statements.length} statements. ` +
        `public tables: ${before.rows[0].n} -> ${after.rowCount}`,
    );
    for (const row of after.rows) console.log(`  ${row.table_name}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

apply().catch((err) => {
  console.error("Schema apply failed:", err.message);
  process.exit(1);
});
