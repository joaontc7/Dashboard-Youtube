// Set DATABASE_URL BEFORE any Prisma imports so the WASM engine can resolve it
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./dev.db";

import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  (() => {
    let url = process.env["TURSO_DATABASE_URL"];
    if (url === "undefined" || url === "null" || !url) {
      url = "file:./dev.db";
    }

    let authToken = process.env["TURSO_AUTH_TOKEN"];
    if (authToken === "undefined" || authToken === "null") {
      authToken = undefined;
    }

    console.log(`[Runtime DB Init] Using URL: ${url}`);

    const libsql = createClient({
      url,
      authToken,
    });

    const adapter = new PrismaLibSql(libsql);
    return new PrismaClient({ adapter });
  })();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
