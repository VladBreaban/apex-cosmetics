import pg from "pg";

const { Client } = pg;

/**
 * Delete an admin account so the next server start re-seeds one.
 *
 * `seedAdmin` in the API server only runs when `admin_users` is empty, so an
 * account created with the wrong password cannot be corrected by changing
 * ADMIN_INITIAL_PASSWORD alone — the row has to go first.
 *
 * Usage:  ADMIN_USERNAME=admin tsx ./src/reset-admin-user.ts
 */
async function reset() {
  const username = process.env.ADMIN_USERNAME ?? "admin";

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const before = await client.query(
      `SELECT id, username, created_at FROM admin_users ORDER BY id`,
    );
    console.log(`Existing admin accounts: ${before.rowCount}`);
    for (const row of before.rows) {
      console.log(`  #${row.id} ${row.username} (created ${row.created_at})`);
    }

    const deleted = await client.query(
      `DELETE FROM admin_users WHERE username = $1`,
      [username],
    );
    console.log(`\nDeleted ${deleted.rowCount} row(s) for "${username}".`);

    const after = await client.query(
      `SELECT count(*)::int AS n FROM admin_users`,
    );
    console.log(`Remaining admin accounts: ${after.rows[0].n}`);
    if (after.rows[0].n === 0) {
      console.log(
        "\nRestart the API. It will seed a fresh admin from ADMIN_INITIAL_PASSWORD.",
      );
    }
  } finally {
    await client.end();
  }
}

reset().catch((err) => {
  console.error("Reset failed:", err.message);
  process.exit(1);
});
