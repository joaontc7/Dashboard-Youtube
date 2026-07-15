import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getYouTubeClient } from "../../../lib/youtube";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { videoId, commentId, text } = await req.json();
    if (!videoId || !commentId || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const youtube = getYouTubeClient((session as any).accessToken);
    
    // Insert reply on YouTube (this is the critical operation)
    await youtube.comments.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          parentId: commentId,
          textOriginal: text,
        }
      }
    });

    // Try to update status in DB (optional)
    try {
      const { prisma } = await import("../../../lib/db");
      await prisma.commentStatus.upsert({
        where: { youtubeCommentId: commentId },
        create: {
          youtubeCommentId: commentId,
          videoId,
          status: "RESPONDIDO",
          verifiedBy: session.user?.email || "Unknown",
          verifiedAt: new Date()
        },
        update: {
          status: "RESPONDIDO",
          verifiedBy: session.user?.email || "Unknown",
          verifiedAt: new Date()
        }
      });
    } catch (dbErr) {
      console.warn("[comments/reply] DB unavailable, status not persisted:", (dbErr as Error).message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
