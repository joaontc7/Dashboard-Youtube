import { NextResponse } from "next/server";
import { prisma } from "../../lib/db";

export async function GET() {
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
      stack: error.stack?.split("\n").slice(0, 5)
    }, { status: 500 });
  }
}
