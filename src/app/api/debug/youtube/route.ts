import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { google } from "googleapis";

export async function GET() {
  const diagnostics: any = { steps: [] };

  try {
    // Step 1: Check session
    const session = await getServerSession(authOptions);
    diagnostics.steps.push({
      step: "1-session",
      hasSession: !!session,
      hasAccessToken: !!(session as any)?.accessToken,
      sessionError: (session as any)?.error || null,
      userEmail: session?.user?.email || null,
    });

    if (!session || !(session as any).accessToken) {
      diagnostics.result = "FAIL: No session or access token";
      return NextResponse.json(diagnostics);
    }

    const accessToken = (session as any).accessToken;
    diagnostics.steps.push({
      step: "2-token",
      tokenLength: accessToken?.length || 0,
      tokenPrefix: accessToken?.substring(0, 10) + "...",
    });

    // Step 2: Try YouTube API - channels.list with mine:true
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const youtube = google.youtube({ version: "v3", auth });

    try {
      const channelRes = await youtube.channels.list({
        part: ["contentDetails", "statistics", "snippet"],
        mine: true,
      });

      const items = channelRes.data.items || [];
      diagnostics.steps.push({
        step: "3-channel",
        status: channelRes.status,
        itemCount: items.length,
        channelTitle: items[0]?.snippet?.title || null,
        uploadsPlaylistId: items[0]?.contentDetails?.relatedPlaylists?.uploads || null,
        subscriberCount: items[0]?.statistics?.subscriberCount || null,
      });

      if (items.length === 0) {
        diagnostics.result = "FAIL: YouTube API returned 0 channels. The logged-in Google account may not have a YouTube channel.";
        return NextResponse.json(diagnostics);
      }

      // Step 3: Try fetching videos from uploads playlist
      const uploadsId = items[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (uploadsId) {
        const playlistRes = await youtube.playlistItems.list({
          part: ["snippet"],
          playlistId: uploadsId,
          maxResults: 3,
        });
        diagnostics.steps.push({
          step: "4-videos",
          status: playlistRes.status,
          videoCount: playlistRes.data.items?.length || 0,
          firstVideoTitle: playlistRes.data.items?.[0]?.snippet?.title || null,
        });
      }

      diagnostics.result = "OK: YouTube API is working!";
    } catch (youtubeError: any) {
      diagnostics.steps.push({
        step: "3-channel-ERROR",
        errorCode: youtubeError.code,
        errorMessage: youtubeError.message,
        errors: youtubeError.errors,
        response: youtubeError.response?.data || null,
      });
      diagnostics.result = `FAIL: YouTube API error - ${youtubeError.message}`;
    }
  } catch (error: any) {
    diagnostics.steps.push({
      step: "UNEXPECTED-ERROR",
      message: error.message,
    });
    diagnostics.result = `FAIL: Unexpected - ${error.message}`;
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
