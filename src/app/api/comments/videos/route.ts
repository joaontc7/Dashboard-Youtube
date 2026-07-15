import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getChannelData, getVideosPage } from "../../../lib/youtube";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accessToken = (session as any).accessToken;
    const channelData = await getChannelData(accessToken);
    if (!channelData) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    
    const uploadsPlaylistId = channelData.contentDetails?.relatedPlaylists?.uploads || "";
    
    const { searchParams } = new URL(req.url);
    const pageToken = searchParams.get("pageToken");

    const data = await getVideosPage(accessToken, uploadsPlaylistId, pageToken || undefined, 20);
    
    // Try to enrich with DB statuses (optional)
    let videosWithStatus = data.videos.map((v: any) => ({ ...v, statusBorder: "clear", localVerifiedCount: 0 }));
    
    try {
      const { prisma } = await import("../../../lib/db");
      const videoIds = data.videos.map((v: any) => v.snippet?.resourceId?.videoId).filter(Boolean);
      const statuses = await prisma.commentStatus.findMany({
        where: { videoId: { in: videoIds } }
      });

      videosWithStatus = data.videos.map((v: any) => {
        const vid = v.snippet?.resourceId?.videoId;
        const vStatuses = statuses.filter((s: any) => s.videoId === vid);
        const totalYoutubeComments = parseInt(v.details?.commentCount || "0");
        const ourStatusesCount = vStatuses.length;
        const verifiedCount = vStatuses.filter((s: any) => s.status === "VERIFICADO" || s.status === "RESPONDIDO").length;
        
        let border = "clear";
        if (totalYoutubeComments > 0) {
          if (ourStatusesCount < totalYoutubeComments) {
            border = "red";
          } else if (verifiedCount < totalYoutubeComments) {
            border = "yellow";
          } else {
            border = "green";
          }
        }

        return {
          ...v,
          statusBorder: border,
          localVerifiedCount: verifiedCount,
        };
      });
    } catch (dbErr) {
      console.warn("[comments/videos] DB unavailable, returning videos without statuses:", (dbErr as Error).message);
      // Keep videosWithStatus as defaulted above (all "clear" borders)
    }

    return NextResponse.json({ videos: videosWithStatus, nextPageToken: data.nextPageToken });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
