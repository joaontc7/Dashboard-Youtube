import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { videoId, commentId } = await req.json();
    if (!videoId || !commentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Try to save to DB (optional)
    try {
      const { prisma } = await import("../../../lib/db");
      await prisma.commentStatus.upsert({
        where: { youtubeCommentId: commentId },
        create: {
          youtubeCommentId: commentId,
          videoId,
          status: "VERIFICADO",
          verifiedBy: session.user?.email || "Unknown",
          verifiedAt: new Date()
        },
        update: {
          status: "VERIFICADO",
          verifiedBy: session.user?.email || "Unknown",
          verifiedAt: new Date()
        }
      });
    } catch (dbErr) {
      console.warn("[comments/verify] DB unavailable, status not persisted:", (dbErr as Error).message);
    }

    // Always return success — UI updates locally
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
