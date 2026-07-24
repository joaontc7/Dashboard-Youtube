import { LUIZ_PAULO_CHANNEL_ID } from "./youtube";

export async function upsertLeadFromComment(prisma: any, commentThread: any, videoTitle?: string) {
  try {
    const topComment = commentThread.snippet?.topLevelComment?.snippet;
    const commentId = commentThread.snippet?.topLevelComment?.id || commentThread.id;
    if (!topComment || !commentId) return;

    const youtubeUserId = topComment.authorChannelId?.value || topComment.authorDisplayName || commentId;
    const authorDisplayName = topComment.authorDisplayName || "Usuário do YouTube";
    const avatarUrl = topComment.authorProfileImageUrl || null;
    const textDisplay = topComment.textDisplay || "";
    const publishedAt = topComment.publishedAt ? new Date(topComment.publishedAt) : new Date();
    const videoId = commentThread.snippet?.videoId || "";

    // Ignore comments by the channel owner himself
    if (youtubeUserId === LUIZ_PAULO_CHANNEL_ID || authorDisplayName.toLowerCase().includes("luiz paulo")) {
      return;
    }

    // 1. Upsert Lead
    const lead = await prisma.lead.upsert({
      where: { youtubeUserId },
      create: {
        youtubeUserId,
        youtubeUsername: authorDisplayName.startsWith("@") ? authorDisplayName.substring(1) : authorDisplayName,
        displayName: authorDisplayName,
        avatarUrl,
        tag: "TRIAGEM",
        interesse: "INDEFINIDO",
      },
      update: {
        displayName: authorDisplayName,
        avatarUrl,
      }
    });

    // 2. Upsert LeadComment
    await prisma.leadComment.upsert({
      where: { commentId },
      create: {
        leadId: lead.id,
        videoId,
        videoTitle: videoTitle || null,
        commentId,
        commentText: textDisplay,
        commentDate: publishedAt,
      },
      update: {
        commentText: textDisplay,
      }
    });
  } catch (err: any) {
    console.error("[leads] Error upserting lead from comment:", err.message);
  }
}
