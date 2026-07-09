import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { getChannelData, getVideosPage } from "../lib/youtube";
import VideosClient from "./VideosClient";

export default async function VideosPage() {
  const session = await getServerSession(authOptions);
  let initialVideos: any[] = [];
  let nextPageToken = "";
  let uploadsPlaylistId = "";
  
  if (session && (session as any).accessToken) {
    try {
      const channelData = await getChannelData((session as any).accessToken);
      if (channelData) {
        uploadsPlaylistId = channelData.contentDetails?.relatedPlaylists?.uploads || "";
        if (uploadsPlaylistId) {
          const data = await getVideosPage((session as any).accessToken, uploadsPlaylistId, undefined, 20);
          initialVideos = data.videos;
          nextPageToken = data.nextPageToken || "";
        }
      }
    } catch (e: any) {
      // Ignora silenciosamente no servidor para evitar a tela vermelha do Next.js.
      // O token de acesso do Google expira em 1 hora se não tivermos refresh token.
      console.log("Aviso: Falha ao buscar dados do YouTube (provavelmente o token expirou).");
    }
  }

  return <VideosClient initialVideos={initialVideos} initialNextPageToken={nextPageToken} uploadsPlaylistId={uploadsPlaylistId} />;
}
