"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function VideoComments() {
  const params = useParams();
  const videoId = params.videoId as string;
  const router = useRouter();
  
  const [comments, setComments] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState("");
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  
  // Reply Float State
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    loadComments();
    loadTemplates();
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

  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) setTemplates(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerify = async (commentId: string) => {
    try {
      const res = await fetch("/api/comments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, commentId }),
      });
      if (res.ok) {
        setComments(prev => prev.map(c => 
          c.snippet?.topLevelComment?.id === commentId ? { ...c, localStatus: "VERIFICADO" } : c
        ));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLike = async (commentId: string) => {
    try {
      await fetch("/api/comments/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      setLikedComments(prev => new Set(prev).add(commentId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Tem certeza que deseja apagar este comentário?")) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.snippet?.topLevelComment?.id !== commentId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitReply = async (commentId: string) => {
    if (!replyText || replyingTo !== commentId) return;
    setReplyLoading(true);
    try {
      const res = await fetch("/api/comments/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, commentId, text: replyText }),
      });
      if (res.ok) {
        // Simulando a nova resposta inserida localmente para atualizar o dashboard na hora
        const newReplyObj = {
          id: `local-${Date.now()}`,
          snippet: {
            authorDisplayName: "Você (Dashboard)",
            authorProfileImageUrl: "https://ui-avatars.com/api/?name=V&background=random",
            textDisplay: replyText,
            publishedAt: new Date().toISOString()
          }
        };

        setComments(prev => prev.map(c => {
          if (c.snippet?.topLevelComment?.id === commentId) {
            const currentReplies = c.replies?.comments || [];
            return { 
              ...c, 
              localStatus: "RESPONDIDO",
              replies: { comments: [newReplyObj, ...currentReplies] }
            };
          }
          return c;
        }));
        
        setReplyingTo(null);
        setReplyText("");
      } else {
        alert("Erro ao enviar resposta.");
      }
    } catch (e) {
      console.error(e);
    }
    setReplyLoading(false);
  };

  return (
    <div style={{ paddingBottom: "150px" }}>
      <div className="toolbar" style={{ marginBottom: "20px" }}>
        <button className="btn btn-ghost" onClick={() => router.back()}>← Voltar</button>
        <h2 style={{ margin: 0 }}>Gerenciando Comentários</h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {comments.map(c => {
          const topComment = c.snippet?.topLevelComment?.snippet;
          const commentId = c.snippet?.topLevelComment?.id;
          const status = c.localStatus;

          return (
            <div key={commentId} className="card" style={{ 
              borderLeft: status === "PENDENTE" ? "4px solid var(--danger)" : "4px solid var(--info)"
            }}>
              <div style={{ display: "flex", gap: "15px" }}>
                <img src={topComment?.authorProfileImageUrl} alt={topComment?.authorDisplayName} className="comment-avatar-sm" style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong style={{ color: "var(--accent)" }}>{topComment?.authorDisplayName}</strong>
                    <span style={{ fontSize: "12px", color: "#666" }}>{new Date(topComment?.publishedAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <p style={{ margin: "10px 0", color: "#e0e0e0" }}>{topComment?.textDisplay}</p>
                  
                  {/* Renderização de respostas */}
                  {c.replies?.comments && c.replies.comments.length > 0 && (
                    <div style={{ marginTop: "15px", paddingLeft: "15px", borderLeft: "2px solid #333", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {c.replies.comments.map((reply: any) => {
                        const replySnippet = reply.snippet;
                        return (
                          <div key={reply.id} style={{ display: "flex", gap: "10px" }}>
                            <img src={replySnippet.authorProfileImageUrl} alt={replySnippet.authorDisplayName} style={{ width: "24px", height: "24px", borderRadius: "50%" }} />
                            <div>
                              <strong style={{ color: "var(--accent)", fontSize: "12px" }}>{replySnippet.authorDisplayName}</strong>
                              <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#ccc" }}>{replySnippet.textDisplay}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <div style={{ display: "flex", gap: "10px", marginTop: "15px", flexWrap: "wrap", alignItems: "center" }}>
                    {status === "PENDENTE" && (
                      <button className="btn btn-sm btn-primary" onClick={() => {
                        setReplyingTo(replyingTo === commentId ? null : commentId);
                        setReplyText("");
                      }}>
                        {replyingTo === commentId ? "Cancelar" : "Responder"}
                      </button>
                    )}
                    <button className="btn btn-sm btn-success" onClick={() => handleVerify(commentId)}>✓ Verificar</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => handleLike(commentId)} disabled={likedComments.has(commentId)}>
                      {likedComments.has(commentId) ? "👍 Curtido" : "👍 Curtir"}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(commentId)}>Excluir</button>
                    <a href={`https://www.youtube.com/watch?v=${videoId}&lc=${commentId}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      Ver no YouTube
                    </a>
                    {status !== "PENDENTE" && <span style={{ marginLeft: "auto", fontSize: "12px", color: "#888", display: "flex", alignItems: "center" }}>Status: {status}</span>}
                  </div>
                  
                  {/* Caixa de Resposta Inline */}
                  {replyingTo === commentId && (
                    <div style={{ marginTop: "20px", background: "#161616", padding: "15px", borderRadius: "8px", border: "1px solid var(--accent)" }}>
                      <h4 style={{ margin: "0 0 15px 0", color: "var(--accent)" }}>Respondendo comentário</h4>
                      <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
                        <textarea 
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder="Digite sua resposta..."
                          style={{ flex: 1, padding: "15px", borderRadius: "8px", background: "#222", border: "1px solid #333", color: "white", resize: "vertical", minHeight: "100px", minWidth: "250px" }}
                        />
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: "200px", flexShrink: 0 }}>
                          <select 
                            onChange={(e) => {
                              const t = templates.find(t => t.id === e.target.value);
                              if (t) setReplyText(prev => prev + (prev ? "\n" : "") + t.content);
                              e.target.value = "";
                            }}
                            style={{ padding: "10px", background: "#222", border: "1px solid #333", color: "white", borderRadius: "8px", width: "100%" }}
                          >
                            <option value="">Inserir Template...</option>
                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                          <button className="btn btn-primary" onClick={() => submitReply(commentId)} disabled={replyLoading} style={{ width: "100%" }}>
                            {replyLoading ? "Enviando..." : "Enviar Resposta"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && <p>Carregando comentários...</p>}
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
