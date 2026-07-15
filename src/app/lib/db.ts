import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  console.log(`[DB Init] Initializing Prisma with adapter. URL exists: ${!!url}, AuthToken exists: ${!!authToken}`);
  if (url) {
    console.log(`[DB Init] URL starts with: ${url.substring(0, 15)}...`);
  }
  
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
