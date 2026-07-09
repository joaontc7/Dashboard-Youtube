import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getVideosPage } from "../../lib/youtube";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pageToken = searchParams.get("pageToken");
  const uploadsPlaylistId = searchParams.get("uploadsPlaylistId");

  if (!uploadsPlaylistId) {
    return NextResponse.json({ error: "Missing uploadsPlaylistId" }, { status: 400 });
  }

  try {
    const data = await getVideosPage((session as any).accessToken, uploadsPlaylistId, pageToken || undefined, 20);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
