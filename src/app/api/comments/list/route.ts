import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "../../../lib/db";
import { getVideoComments } from "../../../lib/youtube";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");
  const pageToken = searchParams.get("pageToken");

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  try {
    // 1. Fetch comments from YouTube
    const ytData = await getVideoComments((session as any).accessToken, videoId, pageToken || undefined, 50);
    if (!ytData) {
      return NextResponse.json({ error: "Failed to fetch from YouTube" }, { status: 500 });
    }

    const comments = ytData.items || [];
    const commentIds = comments.map((c: any) => c.snippet?.topLevelComment?.id).filter(Boolean);

    // 2. Fetch statuses from Prisma
    let statuses = await prisma.commentStatus.findMany({
      where: { youtubeCommentId: { in: commentIds } }
    });

    // 2.1 Salvar os novos comentários no banco como PENDENTES
    const missingIds = commentIds.filter((id: string) => !statuses.find((s: { youtubeCommentId: string }) => s.youtubeCommentId === id));
    if (missingIds.length > 0) {
      await prisma.commentStatus.createMany({
        data: missingIds.map((id: string) => ({
          youtubeCommentId: id,
          videoId: videoId,
          status: "PENDENTE"
        }))
      });
      // Atualiza a lista de statuses com os que acabamos de criar
      const newStatuses = await prisma.commentStatus.findMany({
        where: { youtubeCommentId: { in: missingIds } }
      });
      statuses = [...statuses, ...newStatuses];
    }

    // 3. Merge
    const mergedComments = comments.map((c: any) => {
      const id = c.snippet?.topLevelComment?.id;
      const statusObj = statuses.find((s: { youtubeCommentId: string }) => s.youtubeCommentId === id);
      return {
        ...c,
        localStatus: statusObj?.status || "PENDENTE",
        verifiedBy: statusObj?.verifiedBy || null,
        verifiedAt: statusObj?.verifiedAt || null,
      };
    });

    return NextResponse.json({ comments: mergedComments, nextPageToken: ytData.nextPageToken });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
