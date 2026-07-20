import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
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

    // 2. Try to fetch statuses from DB (optional - DB may not be available)
    let statusMap: Record<string, { status: string; verifiedBy?: string; verifiedAt?: Date }> = {};
    try {
      const { prisma } = await import("../../../lib/db");
      const statuses = await prisma.commentStatus.findMany({
        where: { youtubeCommentId: { in: commentIds } }
      });

      // Try to save new comments, checking if they are already replied to on YouTube
      const existingIds = new Set(statuses.map((s: any) => s.youtubeCommentId));
      const missingIds = commentIds.filter((id: string) => !existingIds.has(id));
      if (missingIds.length > 0) {
        const missingComments = comments.filter((c: any) => missingIds.includes(c.snippet?.topLevelComment?.id));
        await prisma.commentStatus.createMany({
          data: missingComments.map((c: any) => {
            const id = c.snippet.topLevelComment.id;
            const hasReply = (c.snippet.totalReplyCount || 0) > 0;
            return {
              youtubeCommentId: id,
              videoId: videoId,
              status: hasReply ? "RESPONDIDO" : "PENDENTE"
            };
          })
        });
      }

      // Check if any existing pendings now have replies
      const pendingStatuses = statuses.filter((s: any) => s.status === "PENDENTE");
      if (pendingStatuses.length > 0) {
        const pendingIds = pendingStatuses.map((s: any) => s.youtubeCommentId);
        const nowResponded = comments.filter((c: any) => {
          const id = c.snippet?.topLevelComment?.id;
          return id && pendingIds.includes(id) && (c.snippet.totalReplyCount || 0) > 0;
        });
        if (nowResponded.length > 0) {
          const nowRespondedIds = nowResponded.map((c: any) => c.snippet.topLevelComment.id);
          await prisma.commentStatus.updateMany({
            where: { youtubeCommentId: { in: nowRespondedIds } },
            data: { status: "RESPONDIDO" }
          });
          // Update our local array to reflect the updated status
          statuses.forEach((s: any) => {
            if (nowRespondedIds.includes(s.youtubeCommentId)) {
              s.status = "RESPONDIDO";
            }
          });
        }
      }

      // Build status map
      statuses.forEach((s: any) => {
        statusMap[s.youtubeCommentId] = {
          status: s.status,
          verifiedBy: s.verifiedBy,
          verifiedAt: s.verifiedAt,
        };
      });
      missingIds.forEach((id: string) => {
        const correspondingYtComment = comments.find((c: any) => c.snippet?.topLevelComment?.id === id);
        const hasReply = (correspondingYtComment?.snippet?.totalReplyCount || 0) > 0;
        statusMap[id] = { status: hasReply ? "RESPONDIDO" : "PENDENTE" };
      });
    } catch (dbErr) {
      console.warn("[comments/list] DB unavailable, returning YouTube data without statuses:", (dbErr as Error).message);
      // All comments will show as PENDENTE without DB or based on YouTube reply count
      comments.forEach((c: any) => {
        const id = c.snippet?.topLevelComment?.id;
        if (id) {
          const hasReply = (c.snippet?.totalReplyCount || 0) > 0;
          statusMap[id] = { status: hasReply ? "RESPONDIDO" : "PENDENTE" };
        }
      });
    }

    // 3. Merge YouTube data with statuses
    const mergedComments = comments.map((c: any) => {
      const id = c.snippet?.topLevelComment?.id;
      const statusObj = statusMap[id] || { status: "PENDENTE" };
      return {
        ...c,
        localStatus: statusObj.status,
        verifiedBy: statusObj.verifiedBy || null,
        verifiedAt: statusObj.verifiedAt || null,
      };
    });

    return NextResponse.json({ comments: mergedComments, nextPageToken: ytData.nextPageToken });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
