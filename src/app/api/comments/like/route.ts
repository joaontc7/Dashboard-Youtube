import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { google } from "googleapis";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { commentId, rating } = await req.json();
    if (!commentId) {
      return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: (session as any).accessToken });
    const youtube = google.youtube({ version: "v3", auth });

    // YouTube API v3: POST https://www.googleapis.com/youtube/v3/comments/markAsSpam
    // doesn't work for liking. But we can use the undocumented performAction or
    // simply use the comments.setModerationStatus to "heart" a comment.
    // 
    // Actually, the correct approach for "hearting" a creator comment is not 
    // directly available in YouTube Data API v3 for third-party apps.
    //
    // What IS available: we can "like" a comment by using the standard 
    // "like" rating mechanism if the API supports it.
    // 
    // For now, we'll return an honest message about the limitation.
    
    return NextResponse.json({ 
      success: false, 
      message: "A API do YouTube v3 não suporta curtir/❤️ comentários de terceiros. Use o YouTube Studio para dar coração nos comentários." 
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
