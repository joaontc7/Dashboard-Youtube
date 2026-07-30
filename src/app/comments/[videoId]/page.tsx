"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import TemplateModal from "@/app/components/TemplateModal";

export default function VideoComments() {
  const params = useParams();
  const videoId = params.videoId as string;
  const router = useRouter();
  
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // State for inline reply box
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);

  // State for Templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

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
      if (res.ok) {
        setTemplates(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    const cleanText = text.replace(/<[^>]*>/g, "").trim();
    const snippet = cleanText.length > 60 ? cleanText.substring(0, 60) : cleanText;
    navigator.clipboard.writeText(snippet).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 3000);
    });
  };

  const handleSendReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch("/api/comments/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, commentId, text: replyText })
      });
      const data = await res.json();
      if (res.ok) {
        setReplyText("");
        setReplyingToId(null);
        if (data.reply) {
          setComments(prev => prev.map(c => {
            const topId = c.snippet?.topLevelComment?.id || c.id;
            if (topId === commentId) {
              const existingReplies = c.replies?.comments || [];
              return {
                ...c,
                localStatus: "RESPONDIDO",
                replies: {
                  ...c.replies,
                  comments: [...existingReplies, data.reply]
                }
              };
            }
            return c;
          }));
        } else {
          await loadComments();
        }
      } else {
        alert(data.error || "Erro ao responder comentário.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao enviar resposta.");
    }
    setSubmittingReply(false);
  };

  const handleDeleteComment = async (targetId: string, parentCommentId?: string) => {
    if (!confirm("Tem certeza de que deseja excluir este item do YouTube? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const res = await fetch(`/api/comments/${targetId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (parentCommentId) {
          // Remover apenas a resposta específica dentro do comentário pai
          setComments(prev => prev.map(c => {
            const topId = c.snippet?.topLevelComment?.id || c.id;
            if (topId === parentCommentId && c.replies?.comments) {
              return {
                ...c,
                replies: {
                  ...c.replies,
                  comments: c.replies.comments.filter((r: any) => r.id !== targetId)
                }
              };
            }
            return c;
          }));
        } else {
          // Remover o comentário principal inteiro da lista
          setComments(prev => prev.filter(c => (c.snippet?.topLevelComment?.id || c.id) !== targetId));
        }
      } else {
        alert(data.error || "Não foi possível excluir o comentário do YouTube. Verifique suas permissões.");
      }
    } catch (err) {
      console.error("Erro ao excluir comentário:", err);
      alert("Erro de conexão ao tentar excluir.");
    }
  };

  return (
    <div>
      <div className="toolbar" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button className="btn btn-ghost" onClick={() => router.back()}>← Voltar</button>
          <h2 style={{ margin: 0 }}>Comentários do Vídeo</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <a 
            href={`https://studio.youtube.com/video/${videoId}/comments`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            Gerenciar no YouTube Studio
          </a>
          <a 
            href={`https://www.youtube.com/watch?v=${videoId}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            Abrir Vídeo
          </a>
        </div>
      </div>

      <div style={{ marginBottom: "20px", padding: "14px 18px", background: "rgba(134, 104, 93, 0.12)", border: "1px solid rgba(134, 104, 93, 0.35)", borderRadius: "8px", fontSize: "13px", color: "var(--accent-light)", lineHeight: "1.6" }}>
        ✨ <strong>Opções de Gestão de Comentários:</strong><br />
        • <strong>Responder no Dashboard:</strong> Escreva e publique sua resposta como <em>Luiz Paulo Araújo</em> direto por aqui, com suporte a templates rápidos.<br />
        • <strong>Ver no YouTube (Destaque):</strong> Abre a página do vídeo destacando o comentário selecionado no topo.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {comments.map(c => {
          const topComment = c.snippet?.topLevelComment?.snippet;
          const commentId = c.snippet?.topLevelComment?.id || c.id;
          const hasReplies = c.replies?.comments && c.replies.comments.length > 0;
          
          // Strict check: Only true if Luiz Paulo channel actually replied
          const isOwnerResponded = !!(c.replies?.comments && c.replies.comments.some((r: any) => {
            const authorId = r.snippet?.authorChannelId?.value;
            const authorUrl = r.snippet?.authorChannelUrl || "";
            const name = (r.snippet?.authorDisplayName || "").toLowerCase();
            return authorId === "UCfIHSZPt-yQ5foOm7NscflQ" || authorUrl.includes("UCfIHSZPt-yQ5foOm7NscflQ") || name.includes("luiz paulo");
          }));
          const isCopied = copiedId === commentId;
          const isReplying = replyingToId === commentId;

          return (
            <div key={commentId} className="card" style={{ 
              borderLeft: isOwnerResponded ? "4px solid var(--success)" : "4px solid var(--error)"
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
                        const replyId = reply.id;
                        return (
                          <div key={replyId} style={{ display: "flex", gap: "10px", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ display: "flex", gap: "10px" }}>
                              <img src={replySnippet.authorProfileImageUrl} alt={replySnippet.authorDisplayName} style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0 }} />
                              <div>
                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                  <strong style={{ color: "var(--accent)", fontSize: "13px" }}>{replySnippet.authorDisplayName}</strong>
                                  <span style={{ fontSize: "11px", color: "#555" }}>{new Date(replySnippet.publishedAt).toLocaleDateString("pt-BR")}</span>
                                </div>
                                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#ccc", lineHeight: "1.4" }}>{replySnippet.textDisplay}</p>
                              </div>
                            </div>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: "11px", padding: "2px 8px", color: "var(--error)", border: "1px solid rgba(239, 68, 68, 0.2)", flexShrink: 0 }}
                              onClick={() => handleDeleteComment(replyId, commentId)}
                              title="Excluir esta resposta do YouTube"
                            >
                              Excluir
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Caixa de Resposta Inline */}
                  {isReplying && (
                    <div style={{ marginTop: "15px", background: "#181818", padding: "14px", borderRadius: "6px", border: "1px solid #333" }}>
                      {/* Barra de Ações Rápidas de Template */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                        <span style={{ fontSize: "12px", color: "var(--accent-light)", fontWeight: "500" }}>📝 Resposta Rápida:</span>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                setReplyText(prev => prev ? `${prev}\n${e.target.value}` : e.target.value);
                                e.target.value = "";
                              }
                            }}
                            style={{ padding: "5px 10px", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}
                          >
                            <option value="">⚡ Inserir Template Salvo...</option>
                            {templates.map((t: any) => (
                              <option key={t.id} value={t.content}>
                                {t.name}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: "12px", padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                            onClick={() => setIsTemplateModalOpen(true)}
                            title="Criar, editar ou gerenciar templates de resposta"
                          >
                            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                            Criar / Editar Templates
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escreva sua resposta ou insira um template acima (será publicada no YouTube como Luiz Paulo Araújo)..."
                        rows={4}
                        style={{ width: "100%", padding: "10px", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: "4px", fontSize: "13px", lineHeight: "1.5" }}
                      />

                      <div style={{ display: "flex", gap: "10px", marginTop: "10px", justifyContent: "flex-end" }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => { setReplyingToId(null); setReplyText(""); }}
                          disabled={submittingReply}
                        >
                          Cancelar
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSendReply(commentId)}
                          disabled={submittingReply || !replyText.trim()}
                        >
                          {submittingReply ? "Enviando..." : "Enviar Resposta"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Ações do comentário */}
                  <div style={{ marginTop: "15px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      {/* Botão 1: Responder direto no Dashboard como Luiz Paulo */}
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                        onClick={() => {
                          setReplyingToId(isReplying ? null : commentId);
                          setReplyText("");
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        {isReplying ? "Fechar Resposta" : "Responder no Dashboard"}
                      </button>

                      {/* Botão 2: Abrir no YouTube com o comentário destacado */}
                      <a 
                        href={`https://www.youtube.com/watch?v=${videoId}&lc=${commentId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        Ver no YouTube (Destaque)
                      </a>

                      {/* Botão 3: Copiar texto do comentário */}
                      <button 
                        className="btn btn-ghost btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                        onClick={() => copyToClipboard(topComment?.textDisplay || "", commentId)}
                      >
                        {isCopied ? (
                          <>
                            <svg viewBox="0 0 24 24" width="13" height="13" stroke="var(--success)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span style={{ color: "var(--success)" }}>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            Copiar Texto
                          </>
                        )}
                      </button>

                      {/* Botão 4: Excluir Comentário */}
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--error)", border: "1px solid rgba(239, 68, 68, 0.2)" }}
                        onClick={() => handleDeleteComment(commentId)}
                        title="Excluir este comentário do YouTube"
                      >
                        <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        Excluir
                      </button>
                    </div>
                    <span style={{ fontSize: "12px", color: isOwnerResponded ? "var(--success)" : "var(--error)" }}>
                      {isOwnerResponded ? "✓ Respondido" : "⚠ Sem resposta"}
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

      {/* Modal para criar/editar templates */}
      <TemplateModal 
        isOpen={isTemplateModalOpen} 
        onClose={() => {
          setIsTemplateModalOpen(false);
          loadTemplates();
        }} 
      />
    </div>
  );
}
