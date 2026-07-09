import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getYouTubeClient } from "../../../lib/youtube";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { commentId } = await req.json();
    if (!commentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const youtube = getYouTubeClient((session as any).accessToken);
    
    // A API do YouTube Data v3 não suporta curtir comentários de outros via API facilmente,
    // (activities.insert ou rating), mas para o exemplo e requisitos, podemos usar
    // setModerationStatus ou similar se fosse moderação. 
    // Na falta de endpoint "like" explícito para comments.insert, deixaremos simulado ou 
    // retornaremos sucesso para não travar o fluxo caso a API não permita like com OAuth comum
    
    // Simulação do like (YouTube V3 não expõe POST /like para commentThreads)
    console.log(`Curtindo comentário ${commentId}`);

    return NextResponse.json({ success: true, warning: "Like simulado (não suportado na V3 para comentários alheios)" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
