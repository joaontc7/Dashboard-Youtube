import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "../../../lib/db";
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
    
    // Agora buscar os status do prisma para esses vídeos
    const videoIds = data.videos.map((v: any) => v.snippet?.resourceId?.videoId).filter(Boolean);
    const statuses = await prisma.commentStatus.findMany({
      where: { videoId: { in: videoIds } }
    });

    const videosWithStatus = data.videos.map((v: any) => {
      const vid = v.snippet?.resourceId?.videoId;
      const vStatuses = statuses.filter(s => s.videoId === vid);
      const totalYoutubeComments = parseInt(v.details?.commentCount || "0");
      const ourStatusesCount = vStatuses.length;
      const verifiedCount = vStatuses.filter(s => s.status === "VERIFICADO" || s.status === "RESPONDIDO").length;
      
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

    return NextResponse.json({ videos: videosWithStatus, nextPageToken: data.nextPageToken });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
