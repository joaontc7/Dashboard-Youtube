import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function GET() {
  try {
    // Um cálculo simples para stats (no futuro pode envolver o YouTube API)
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
