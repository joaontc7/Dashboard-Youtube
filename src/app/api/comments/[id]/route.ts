import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getYouTubeClient } from "../../../lib/youtube";
import { prisma } from "../../../lib/db";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Sessão não encontrada. Faça login novamente." }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "ID do comentário ausente" }, { status: 400 });

    const youtube = getYouTubeClient((session as any).accessToken);

    // 1. Tenta deletar diretamente o comentário
    try {
      await youtube.comments.delete({ id });
    } catch (deleteErr: any) {
      console.warn(`[comments/delete] youtube.comments.delete falhou para ${id}:`, deleteErr?.message || deleteErr);
      
      // 2. Se a exclusão direta falhar, tenta rejeitar o comentário através da API de moderação do YouTube
      try {
        await youtube.comments.setModerationStatus({
          id: [id],
          moderationStatus: "rejected"
        });
      } catch (modErr: any) {
        console.error(`[comments/delete] youtube.comments.setModerationStatus também falhou para ${id}:`, modErr?.message || modErr);
        
        const errorMessage = deleteErr?.message || modErr?.message || "";
        if (errorMessage.includes("insufficientPermissions") || deleteErr?.code === 403 || modErr?.code === 403) {
          return NextResponse.json({ 
            error: "Sua sessão atual não possui permissão de gravação/exclusão no YouTube. Por favor, faça Logout no Dashboard e entre novamente permitindo a gerência do canal." 
          }, { status: 403 });
        }
        throw modErr || deleteErr;
      }
    }

    // 3. Se estava gravado no banco local, limpa o registro
    try {
      await prisma.commentStatus.delete({ where: { youtubeCommentId: id } });
    } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[comments/delete] Erro final:", error);
    return NextResponse.json({ error: error?.message || "Erro ao excluir comentário" }, { status: 500 });
  }
}
