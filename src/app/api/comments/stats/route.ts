import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { prisma } = await import("../../../lib/db");
    const totalStatuses = await prisma.commentStatus.count();
    const verifiedStatuses = await prisma.commentStatus.count({
      where: { OR: [{ status: "VERIFICADO" }, { status: "RESPONDIDO" }] }
    });
    
    const pendingVideos = await prisma.commentStatus.groupBy({
      by: ['videoId'],
      where: { status: "PENDENTE" }
    });

    return NextResponse.json({
      unrespondedCount: totalStatuses - verifiedStatuses,
      pendingVideosCount: pendingVideos.length,
      totalTracked: totalStatuses
    });
  } catch (error: any) {
    console.warn("[comments/stats] DB unavailable, returning zeros:", error.message);
    // Return zeros gracefully if DB is down
    return NextResponse.json({
      unrespondedCount: 0,
      pendingVideosCount: 0,
      totalTracked: 0
    });
  }
}
