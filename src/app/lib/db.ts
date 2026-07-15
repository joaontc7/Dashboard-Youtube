import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  
  // Set DATABASE_URL programmatically to a dummy sqlite file so that Prisma 7's engine
  // validation passes (since it expects file: or sqlite: provider), while we use the driver adapter.
  process.env.DATABASE_URL = "file:./dev.db";

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
