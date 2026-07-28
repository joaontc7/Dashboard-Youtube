import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getYouTubeClient, getChannelOwnerAccessToken } from "../../../lib/youtube";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { videoId, commentId, text } = await req.json();
    if (!videoId || !commentId || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Tenta usar o token do dono do canal gravado no banco, ou usa o token da sessão
    const ownerToken = await getChannelOwnerAccessToken();
    const accessTokenToUse = ownerToken || (session as any).accessToken;
    const youtube = getYouTubeClient(accessTokenToUse);

    // 2. Insere a resposta no YouTube
    const insertRes = await youtube.comments.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          parentId: commentId,
          textOriginal: text,
        }
      }
    });

    const insertedReply = insertRes.data;

    // 3. Atualiza o status do comentário para RESPONDIDO no banco local
    try {
      const { prisma } = await import("../../../lib/db");
      await prisma.commentStatus.upsert({
        where: { youtubeCommentId: commentId },
        create: {
          youtubeCommentId: commentId,
          videoId,
          status: "RESPONDIDO",
          verifiedBy: session.user?.email || "Unknown",
          verifiedAt: new Date()
        },
        update: {
          status: "RESPONDIDO",
          verifiedBy: session.user?.email || "Unknown",
          verifiedAt: new Date()
        }
      });

      // 4. Cadastra / Atualiza o Lead no CRM automaticamente
      try {
        const threadRes = await youtube.commentThreads.list({
          part: ["snippet"],
          id: [commentId]
        });
        if (threadRes.data.items && threadRes.data.items.length > 0) {
          const { upsertLeadFromComment } = await import("../../../lib/leads");
          await upsertLeadFromComment(threadRes.data.items[0]);
        }
      } catch (leadErr) {
        console.warn("[comments/reply] Error upserting lead:", (leadErr as Error).message);
      }

    } catch (dbErr) {
      console.warn("[comments/reply] DB unavailable, status not persisted:", (dbErr as Error).message);
    }

    return NextResponse.json({ 
      success: true, 
      reply: insertedReply 
    });
  } catch (error: any) {
    console.error("[comments/reply] Error:", error);
    return NextResponse.json({ error: error.message || "Erro ao enviar resposta" }, { status: 500 });
  }
}
