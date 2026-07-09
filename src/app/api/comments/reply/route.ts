import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getYouTubeClient } from "../../../lib/youtube";
import { prisma } from "../../../lib/db";

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
    
    // Inserir resposta no YouTube
    await youtube.comments.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          parentId: commentId,
          textOriginal: text,
        }
      }
    });

    // Atualizar status no Prisma
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
