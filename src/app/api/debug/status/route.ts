import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "../../../lib/db";
import { getYouTubeClient } from "../../../lib/youtube";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  let ytStatus = "Desconectado";
  if (session && (session as any).accessToken) {
    try {
       const yt = getYouTubeClient((session as any).accessToken);
       const res = await yt.channels.list({ part: ["id"], mine: true });
       if (res.data.items && res.data.items.length > 0) {
         ytStatus = "Conectado (Token Válido)";
       } else {
         ytStatus = "Conectado, mas sem canais associados ao e-mail";
       }
    } catch(e: any) {
       ytStatus = "Erro na API: " + e.message;
    }
  }

  try {
    const leadsCount = await prisma.lead.count();
    const templatesCount = await prisma.template.count();
    const commentStatusesCount = await prisma.commentStatus.count();

    return NextResponse.json({
      api: {
        youtube: ytStatus,
      },
      db: {
        leads: leadsCount,
        templates: templatesCount,
        commentStatuses: commentStatusesCount
      },
      system: {
        nodeVersion: process.version,
        sessionUser: session?.user?.email || "Nenhum"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
