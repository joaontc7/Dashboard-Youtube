import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getYouTubeClient } from "../../../lib/youtube";
import { prisma } from "../../../lib/db";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const youtube = getYouTubeClient((session as any).accessToken);
    await youtube.comments.delete({ id });

    // Se estiver no banco local, deleta tbm
    try {
      await prisma.commentStatus.delete({ where: { youtubeCommentId: id } });
    } catch(e) {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
