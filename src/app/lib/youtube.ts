import { google } from "googleapis";

export function getYouTubeClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.youtube({ version: "v3", auth });
}

export const LUIZ_PAULO_CHANNEL_ID = "UCfIHSZPt-yQ5foOm7NscflQ";

export async function getChannelOwnerAccessToken(): Promise<string | null> {
  try {
    const { prisma } = await import("./db");
    const sysConfig = await prisma.systemConfig.findUnique({
      where: { key: "google_refresh_token" }
    });
    
    const refreshToken = sysConfig?.value;
    if (!refreshToken) return null;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: refreshToken
      })
    });

    if (!res.ok) {
      console.warn("[getChannelOwnerAccessToken] Refresh token exchange failed:", res.statusText);
      return null;
    }
    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.error("[getChannelOwnerAccessToken] Error fetching token:", err);
    return null;
  }
}

export function isOwnerResponded(commentThread: any): boolean {
  if (!commentThread) return false;
  const replies = commentThread.replies?.comments;
  if (!replies || !Array.isArray(replies) || replies.length === 0) {
    return false;
  }
  return replies.some((r: any) => {
    const authorId = r.snippet?.authorChannelId?.value;
    const authorUrl = r.snippet?.authorChannelUrl || "";
    const name = (r.snippet?.authorDisplayName || "").toLowerCase();
    return authorId === LUIZ_PAULO_CHANNEL_ID || authorUrl.includes(LUIZ_PAULO_CHANNEL_ID) || name.includes("luiz paulo");
  });
}

export async function getChannelData(accessToken: string) {
  const youtube = getYouTubeClient(accessToken);
  const channelRes = await youtube.channels.list({
    part: ["contentDetails", "statistics", "snippet"],
    id: [LUIZ_PAULO_CHANNEL_ID],
  });

  if (!channelRes.data.items || channelRes.data.items.length === 0) {
    return null;
  }
  return channelRes.data.items[0];
}

export async function getVideosPage(accessToken: string, uploadsPlaylistId: string, pageToken?: string, maxResults = 20) {
  const youtube = getYouTubeClient(accessToken);
  const playlistRes = await youtube.playlistItems.list({
    part: ["snippet"],
    playlistId: uploadsPlaylistId,
    maxResults,
    pageToken,
  });

  const videos = playlistRes.data.items || [];
  const nextPageToken = playlistRes.data.nextPageToken;

  if (videos.length === 0) return { videos: [], nextPageToken };

  const videoIds = videos.map(v => v.snippet?.resourceId?.videoId).filter(Boolean) as string[];
  const details = await getVideoDetails(accessToken, videoIds);

  const enrichedVideos = videos.map(v => {
    const detail = details.find((d: any) => d.id === v.snippet?.resourceId?.videoId);
    return {
      ...v,
      details: detail ? {
        duration: formatDuration(detail.contentDetails?.duration),
        isShort: isShortVideo(detail.contentDetails?.duration),
        viewCount: detail.statistics?.viewCount || "0",
        likeCount: detail.statistics?.likeCount || "0",
        commentCount: detail.statistics?.commentCount || "0",
      } : null
    };
  });

  return { videos: enrichedVideos, nextPageToken };
}

export async function getVideoDetails(accessToken: string, videoIds: string[]) {
  if (videoIds.length === 0) return [];
  const youtube = getYouTubeClient(accessToken);
  const res = await youtube.videos.list({
    part: ["contentDetails", "statistics"],
    id: videoIds,
  });
  return res.data.items || [];
}

export async function getVideoComments(accessToken: string, videoId: string, pageToken?: string, maxResults = 50) {
  const youtube = getYouTubeClient(accessToken);
  try {
    const res = await youtube.commentThreads.list({
      part: ["snippet", "replies"],
      videoId: videoId,
      maxResults,
      pageToken,
    });
    return res.data;
  } catch (error) {
    console.error("Failed to fetch comments for video", videoId, error);
    return null;
  }
}

export function formatDuration(isoDuration?: string | null): string {
  if (!isoDuration) return "0:00";
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return "0:00";
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function isShortVideo(isoDuration?: string | null): boolean {
  if (!isoDuration) return false;
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return false;
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  return totalSeconds <= 60;
}
