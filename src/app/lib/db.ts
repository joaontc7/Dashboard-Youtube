// Set DATABASE_URL BEFORE any Prisma imports so the WASM engine can resolve it
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./dev.db";

import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  console.log(`[Runtime DB Init] TURSO_DATABASE_URL exists: ${!!url}`);

  const adapter = new PrismaLibSql(
    createClient({
      url: url || "file:./dev.db",
      authToken: authToken,
    }) as any
  );
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
