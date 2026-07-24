import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Resend } from "resend";
import { prisma } from "../../../lib/db";
import { getChannelData, getVideosPage, getVideoComments, isOwnerResponded } from "../../../lib/youtube";

export const maxDuration = 60; // Permite que a Vercel rode esse script por mais tempo se necessário


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    
    // 1. Validar Segredo
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    // 2. Buscar Refresh Token
    const tokenConfig = await prisma.systemConfig.findUnique({ where: { key: "google_refresh_token" } });
    if (!tokenConfig || !tokenConfig.value) {
      return NextResponse.json({ error: "No refresh token found. User must login first." }, { status: 400 });
    }

    // 3. Obter novo Access Token
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ refresh_token: tokenConfig.value });
    const { credentials } = await auth.refreshAccessToken();
    const accessToken = credentials.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: "Failed to generate access token" }, { status: 500 });
    }

    // 4. Buscar vídeos recentes
    const channelData = await getChannelData(accessToken);
    if (!channelData) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    const uploadsPlaylistId = channelData.contentDetails?.relatedPlaylists?.uploads || "";
    
    // Busca apenas os 10 vídeos mais recentes para economizar cota da API em background
    const data = await getVideosPage(accessToken, uploadsPlaylistId, undefined, 10);
    const videos = data.videos || [];

    let newCommentsFound: any[] = [];

    // 5. Verificar novos comentários
    for (const v of videos) {
      const videoId = v.snippet?.resourceId?.videoId;
      if (!videoId) continue;
      
      const commentThreads = await getVideoComments(accessToken, videoId, undefined, 50);
      if (!commentThreads || !commentThreads.items) continue;

      const commentIds = commentThreads.items.map((c: any) => c.snippet?.topLevelComment?.id).filter(Boolean);
      
      const existingStatuses = await prisma.commentStatus.findMany({
        where: { youtubeCommentId: { in: commentIds } }
      });

      const missingIds = commentIds.filter((id: string) => !existingStatuses.find((s: any) => s.youtubeCommentId === id));
      
      if (missingIds.length > 0) {
        // Encontrou novos! Mapear para inserir no banco e no e-mail
        const missingComments = commentThreads.items.filter((c: any) => missingIds.includes(c.snippet?.topLevelComment?.id));
        
        // Apenas alertar por email os novos comentários que de fato estão SEM resposta do canal
        const pendingComments = missingComments.filter((c: any) => !isOwnerResponded(c));
        if (pendingComments.length > 0) {
          newCommentsFound = [...newCommentsFound, ...pendingComments.map((c: any) => ({
            videoId,
            videoTitle: v.snippet?.title,
            ...c
          }))];
        }
        
        await prisma.commentStatus.createMany({
          data: missingComments.map((c: any) => {
            const id = c.snippet.topLevelComment.id;
            const hasReply = isOwnerResponded(c);
            return {
              youtubeCommentId: id,
              videoId: videoId,
              status: hasReply ? "RESPONDIDO" : "PENDENTE"
            };
          })
        });
      }

      // Atualizar no banco os comentários que eram PENDENTE mas agora já foram respondidos pelo canal
      const pendingStatuses = existingStatuses.filter((s: any) => s.status === "PENDENTE");
      if (pendingStatuses.length > 0) {
        const pendingIds = pendingStatuses.map((s: any) => s.youtubeCommentId);
        const nowResponded = commentThreads.items.filter((c: any) => {
          const id = c.snippet?.topLevelComment?.id;
          return id && pendingIds.includes(id) && isOwnerResponded(c);
        });
        if (nowResponded.length > 0) {
          const nowRespondedIds = nowResponded.map((c: any) => c.snippet.topLevelComment.id);
          await prisma.commentStatus.updateMany({
            where: { youtubeCommentId: { in: nowRespondedIds } },
            data: { status: "RESPONDIDO" }
          });
        }
      }
    }

    // 6. Disparar E-mail
    if (newCommentsFound.length > 0) {
      const whitelist = process.env.WHITELIST_EMAILS?.split(",").filter(Boolean) || [];
      if (whitelist.length > 0 && process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const htmlBody = `
          <h2>Você tem ${newCommentsFound.length} novos comentários!</h2>
          <p>Os seguintes comentários acabaram de ser rastreados no canal:</p>
          <hr />
          ${newCommentsFound.map(c => `
            <div style="margin-bottom: 20px;">
              <strong>Vídeo:</strong> ${c.videoTitle}<br/>
              <strong>Autor:</strong> ${c.snippet?.topLevelComment?.snippet?.authorDisplayName}<br/>
              <strong>Comentário:</strong> <i>"${c.snippet?.topLevelComment?.snippet?.textDisplay}"</i><br/>
              <a href="https://www.youtube.com/watch?v=${c.videoId}&lc=${c.snippet?.topLevelComment?.id}">Ver no YouTube</a>
            </div>
          `).join("")}
          <br/>
          <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}">Acesse o Dashboard para responder.</a></p>
        `;

        await resend.emails.send({
          from: "Dashboard Iron Masters <onboarding@resend.dev>",
          to: whitelist,
          subject: `🔔 ${newCommentsFound.length} novos comentários no YouTube!`,
          html: htmlBody,
        });
      }
    }

    return NextResponse.json({ 
      status: "Success", 
      newCommentsProcessed: newCommentsFound.length 
    });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
