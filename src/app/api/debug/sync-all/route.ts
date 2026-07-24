import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getChannelData, getVideosPage, getVideoComments, isOwnerResponded } from "../../../lib/youtube";
import { prisma } from "../../../lib/db";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accessToken = (session as any).accessToken;
    const channelData = await getChannelData(accessToken);
    if (!channelData) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const uploadsPlaylistId = channelData.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
      return NextResponse.json({ error: "Uploads playlist not found" }, { status: 400 });
    }

    // Fetch the 50 most recent videos
    const data = await getVideosPage(accessToken, uploadsPlaylistId, undefined, 50);
    const videos = data.videos || [];
    let totalSynced = 0;

    for (const v of videos) {
      const videoId = v.snippet?.resourceId?.videoId;
      if (!videoId) continue;

      try {
        const commentThreads = await getVideoComments(accessToken, videoId, undefined, 50);
        if (!commentThreads || !commentThreads.items) continue;

        const commentIds = commentThreads.items.map((c: any) => c.snippet?.topLevelComment?.id).filter(Boolean);
        if (commentIds.length === 0) continue;

        const existingStatuses = await prisma.commentStatus.findMany({
          where: { youtubeCommentId: { in: commentIds } }
        });

        const existingIdsSet = new Set(existingStatuses.map((s: any) => s.youtubeCommentId));
        const missingIds = commentIds.filter((id: string) => !existingIdsSet.has(id));

        if (missingIds.length > 0) {
          const missingComments = commentThreads.items.filter((c: any) => missingIds.includes(c.snippet?.topLevelComment?.id));
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

        // Update existing pendings that now have owner replies
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

        totalSynced += commentIds.length;
      } catch (err: any) {
        console.error(`Error syncing video ${videoId}:`, err.message);
      }
    }

    return NextResponse.json({ success: true, videosCount: videos.length, commentsSynced: totalSynced });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
