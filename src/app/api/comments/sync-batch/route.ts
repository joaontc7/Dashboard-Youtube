import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getVideoComments, isOwnerResponded } from "../../../lib/youtube";
import { prisma } from "../../../lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { videoIds } = await req.json();
    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json({ error: "Missing or invalid videoIds" }, { status: 400 });
    }

    const accessToken = (session as any).accessToken;

    // Limit to maximum 20 videos per batch to prevent gateway timeout
    const batchList = videoIds.slice(0, 20);
    const results = [];

    for (const videoId of batchList) {
      try {
        const commentThreads = await getVideoComments(accessToken, videoId, undefined, 50);
        if (!commentThreads || !commentThreads.items) {
          results.push({ videoId, status: "Skipped (No comments or API error)" });
          continue;
        }

        const commentIds = commentThreads.items.map((c: any) => c.snippet?.topLevelComment?.id).filter(Boolean);
        if (commentIds.length === 0) {
          results.push({ videoId, status: "Synced (0 comments)" });
          continue;
        }

        // Fetch existing statuses for these comments
        const existingStatuses = await prisma.commentStatus.findMany({
          where: { youtubeCommentId: { in: commentIds } }
        });

        const existingIdsSet = new Set(existingStatuses.map((s: any) => s.youtubeCommentId));
        const missingIds = commentIds.filter((id: string) => !existingIdsSet.has(id));

        // 1. Insert missing comments
        if (missingIds.length > 0) {
          const missingComments = commentThreads.items.filter((c: any) => {
            const id = c.snippet?.topLevelComment?.id;
            return id && missingIds.includes(id);
          });

          await prisma.commentStatus.createMany({
            data: missingComments.map((c: any) => {
              const id = c.snippet.topLevelComment.id;
              const hasReply = isOwnerResponded(c);
              return {
                youtubeCommentId: id,
                videoId: videoId,
                status: hasReply ? "RESPONDIDO" : "PENDENTE"
              };
            })
          });
        }

        // 2. Update existing PENDENTE comments that now have owner replies
        const pendingStatuses = existingStatuses.filter((s: any) => s.status === "PENDENTE");
        if (pendingStatuses.length > 0) {
          const pendingIds = pendingStatuses.map((s: any) => s.youtubeCommentId);
          const nowResponded = commentThreads.items.filter((c: any) => {
            const id = c.snippet?.topLevelComment?.id;
            return id && pendingIds.includes(id) && isOwnerResponded(c);
          });

          if (nowResponded.length > 0) {
            const nowRespondedIds = nowResponded.map((c: any) => c.snippet.topLevelComment.id);
            await prisma.commentStatus.updateMany({
              where: { youtubeCommentId: { in: nowRespondedIds } },
              data: { status: "RESPONDIDO" }
            });
          }
        }

        results.push({ videoId, status: "Synced successfully", count: commentIds.length });
      } catch (videoError: any) {
        console.error(`Failed to sync comments for video ${videoId}:`, videoError.message);
        results.push({ videoId, status: `Error: ${videoError.message}` });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
