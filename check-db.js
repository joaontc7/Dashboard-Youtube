const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables in prisma/dev.db:", JSON.stringify(tables, null, 2));
db.close();
