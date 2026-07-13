const { createClient } = require('@libsql/client');
const fs = require('fs');

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("Missing TURSO variables");
    process.exit(1);
  }

  const client = createClient({ url, authToken });
  const sql = fs.readFileSync('schema.sql', 'utf8');

  // LibSQL executeMultiple runs multiple statements
  console.log(`Executing SQL batch...`);
  try {
    await client.executeMultiple(sql);
    console.log("Migration to Turso complete!");
  } catch (e) {
    console.error("ERROR executing SQL:", e.message);
  }
}

main();
