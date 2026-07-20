import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getChannelData, getVideosPage } from "../../../lib/youtube";
import { prisma } from "../../../lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken || (session as any).error === "RefreshAccessTokenError") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accessToken = (session as any).accessToken;
    const channelData = await getChannelData(accessToken);
    let subscriberCount = "0";
    let viewCount = "0";
    let videoCount = "0";
    
    if (channelData) {
      subscriberCount = channelData.statistics?.subscriberCount || "0";
      viewCount = channelData.statistics?.viewCount || "0";
      videoCount = channelData.statistics?.videoCount || "0";
    }

    // Pega os últimos 10 vídeos para o gráfico
    let recentVideos: any[] = [];
    if (channelData?.contentDetails?.relatedPlaylists?.uploads) {
       const vids = await getVideosPage(accessToken, channelData.contentDetails.relatedPlaylists.uploads, undefined, 10);
       recentVideos = vids.videos.map((v: any) => ({
         title: v.snippet?.title || "Sem título",
         viewCount: parseInt(v.details?.viewCount || "0")
       })).reverse(); // Mais antigos primeiro no gráfico para ver a evolução
    }

    const avgViewsPerVideo = parseInt(videoCount) > 0 ? Math.floor(parseInt(viewCount) / parseInt(videoCount)) : 0;

    let unrespondedCount = 0;
    try {
      unrespondedCount = await prisma.commentStatus.count({
        where: { status: "PENDENTE" }
      });
    } catch (dbErr) {
      console.warn("[dashboard/stats] Failed to count unresponded comments:", dbErr);
    }

    return NextResponse.json({
      subscriberCount,
      viewCount,
      videoCount,
      avgViewsPerVideo,
      recentVideos,
      unrespondedCount
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
