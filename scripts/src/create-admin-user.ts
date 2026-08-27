import pg from "pg";
import { scryptSync, randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const { Client } = pg;

/**
 * Create an admin account, or reset the password on an existing one.
 *
 * Preferred over `reset-admin-user.ts` for a deployed database: that one
 * deletes the row and leans on the server re-seeding from
 * ADMIN_INITIAL_PASSWORD at boot, which means an App Service restart and a
 * window with no admin at all. This writes the hash directly, so the account
 * is usable the moment the script finishes.
 *
 * The hash format — "salt:hash" hex, scrypt with a 16-byte salt and a 64-byte
 * key — must stay in step with `hashPassword` in
 * artifacts/api-server/src/lib/adminAuth.ts.
 *
 * Usage:
 *   DATABASE_URL=... tsx ./src/create-admin-user.ts [username]
 *
 * The password is read from ADMIN_PASSWORD when set, otherwise prompted for.
 */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function readPassword(): Promise<string> {
  const fromEnv = process.env.ADMIN_PASSWORD;
  if (fromEnv) return fromEnv;

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const password = await rl.question("New admin password: ");
    return password.trim();
  } finally {
    rl.close();
  }
}

async function main() {
  const username = (process.argv[2] ?? process.env.ADMIN_USERNAME ?? "admin").trim();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }
  if (username.length < 3 || username.length > 50) {
    throw new Error("Username must be between 3 and 50 characters.");
  }

  const password = await readPassword();
  if (password.length < 12) {
    // The API only enforces 6, but this account is the whole admin panel and
    // the panel is reachable from the public internet.
    throw new Error("Password must be at least 12 characters.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const existing = await client.query(
      `SELECT id, username, created_at FROM admin_users ORDER BY id`,
    );
    console.log(`Existing admin accounts: ${existing.rowCount}`);
    for (const row of existing.rows) {
      console.log(`  #${row.id} ${row.username} (created ${row.created_at})`);
    }

    const { rows } = await client.query(
      `INSERT INTO admin_users (username, password_hash)
            VALUES ($1, $2)
       ON CONFLICT (username)
     DO UPDATE SET password_hash = EXCLUDED.password_hash
         RETURNING id, username, (xmax = 0) AS inserted`,
      [username, hashPassword(password)],
    );

    const row = rows[0];
    console.log(
      row.inserted
        ? `\nCreated admin #${row.id} "${row.username}".`
        : `\nReset the password on existing admin #${row.id} "${row.username}".`,
    );
    console.log("Log in at /admin/ — no restart needed.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
