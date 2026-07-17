import { NextResponse } from "next/server";
import { prisma } from "../../lib/db";

export async function GET() {
  console.log(`[test-db route] process.env.TURSO_DATABASE_URL:`, process.env.TURSO_DATABASE_URL);
  console.log(`[test-db route] process.env.DATABASE_URL:`, process.env.DATABASE_URL);
  try {
    const leadCount = await prisma.lead.count();
    const templateCount = await prisma.template.count();
    const commentStatusCount = await prisma.commentStatus.count();
    
    return NextResponse.json({ 
      status: "OK", 
      leadCount, 
      templateCount,
      commentStatusCount,
      message: "Prisma funciona!" 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: "ERROR", 
      error: error.message,
      debugUrl: process.env.TURSO_DATABASE_URL,
      debugType: typeof process.env.TURSO_DATABASE_URL,
      stack: error.stack?.split("\n").slice(0, 5)
    }, { status: 500 });
  }
}
