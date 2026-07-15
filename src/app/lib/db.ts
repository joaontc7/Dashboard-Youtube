import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  
  // Set DATABASE_URL programmatically so that Prisma 7's engine
  // validation doesn't throw "URL_INVALID: The URL 'undefined' is not in a valid format"
  process.env.DATABASE_URL = url || "file:./dev.db";

  console.log(`[Runtime DB Init] Setting process.env.DATABASE_URL. URL exists: ${!!url}`);
  
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
