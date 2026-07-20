"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function VideoComments() {
  const params = useParams();
  const videoId = params.videoId as string;
  const router = useRouter();
  
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState("");

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = async (token?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments/list?videoId=${videoId}${token ? `&pageToken=${token}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setComments(prev => token ? [...prev, ...data.comments] : data.comments);
        setNextPageToken(data.nextPageToken || "");
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="toolbar" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button className="btn btn-ghost" onClick={() => router.back()}>← Voltar</button>
          <h2 style={{ margin: 0 }}>Comentários do Vídeo</h2>
        </div>
        <a 
          href={`https://www.youtube.com/watch?v=${videoId}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          Responder no YouTube
        </a>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {comments.map(c => {
          const topComment = c.snippet?.topLevelComment?.snippet;
          const commentId = c.snippet?.topLevelComment?.id;
          const hasReplies = c.replies?.comments && c.replies.comments.length > 0;

          return (
            <div key={commentId} className="card" style={{ 
              borderLeft: hasReplies ? "4px solid var(--success)" : "4px solid var(--danger)"
            }}>
              <div style={{ display: "flex", gap: "15px" }}>
                <img src={topComment?.authorProfileImageUrl} alt={topComment?.authorDisplayName} style={{ width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "var(--accent)" }}>{topComment?.authorDisplayName}</strong>
                    <span style={{ fontSize: "12px", color: "#666" }}>{new Date(topComment?.publishedAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <p style={{ margin: "10px 0", color: "#e0e0e0", lineHeight: "1.5" }}>{topComment?.textDisplay}</p>
                  
                  {/* Likes do comentário */}
                  {topComment?.likeCount > 0 && (
                    <span style={{ fontSize: "12px", color: "#888" }}>👍 {topComment.likeCount}</span>
                  )}

                  {/* Respostas existentes */}
                  {hasReplies && (
                    <div style={{ marginTop: "15px", paddingLeft: "15px", borderLeft: "2px solid #333", display: "flex", flexDirection: "column", gap: "12px" }}>
                      {c.replies.comments.map((reply: any) => {
                        const replySnippet = reply.snippet;
                        return (
                          <div key={reply.id} style={{ display: "flex", gap: "10px" }}>
                            <img src={replySnippet.authorProfileImageUrl} alt={replySnippet.authorDisplayName} style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0 }} />
                            <div>
                              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <strong style={{ color: "var(--accent)", fontSize: "13px" }}>{replySnippet.authorDisplayName}</strong>
                                <span style={{ fontSize: "11px", color: "#555" }}>{new Date(replySnippet.publishedAt).toLocaleDateString("pt-BR")}</span>
                              </div>
                              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#ccc", lineHeight: "1.4" }}>{replySnippet.textDisplay}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Link direto para o comentário no YouTube */}
                  <div style={{ marginTop: "15px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <a 
                      href={`https://www.youtube.com/watch?v=${videoId}&lc=${commentId}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-ghost btn-sm" 
                      style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      Ver no YouTube
                    </a>
                    <span style={{ fontSize: "12px", color: hasReplies ? "var(--success)" : "var(--danger)" }}>
                      {hasReplies ? "✓ Respondido" : "⚠ Sem resposta"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {loading && <p style={{ textAlign: "center", color: "#888" }}>Carregando comentários...</p>}
        {!loading && comments.length === 0 && <p className="empty-state">Nenhum comentário encontrado.</p>}
        {nextPageToken && !loading && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button className="btn btn-secondary" onClick={() => loadComments(nextPageToken)}>Carregar mais</button>
          </div>
        )}
      </div>
    </div>
  );
}
