"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import TemplateModal from "../components/TemplateModal";

export default function CommentsOverview() {
  const [stats, setStats] = useState({ unrespondedCount: 0, pendingVideosCount: 0, totalTracked: 0 });
  const [videos, setVideos] = useState<any[]>([]);
  const [nextPageToken, setNextPageToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  useEffect(() => {
    loadStats();
    loadVideos();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/comments/stats");
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadVideos = async (token?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments/videos${token ? `?pageToken=${token}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setVideos(prev => token ? [...prev, ...data.videos] : data.videos);
        setNextPageToken(data.nextPageToken || "");
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Gestão de <span>Comentários</span></h1>
          <p className="page-subtitle">Acompanhe métricas, templates e gerencie comentários por vídeo.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsTemplateModalOpen(true)}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Templates
        </button>
      </div>

      <div className="stat-grid" style={{ marginBottom: "30px" }}>
        <div className="stat-card">
          <div className="stat-label">Comentários s/ Interação</div>
          <div className="stat-value" style={{ color: "var(--danger)" }}>{stats.unrespondedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Vídeos Pendentes</div>
          <div className="stat-value" style={{ color: "var(--warning)" }}>{stats.pendingVideosCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Rastreados</div>
          <div className="stat-value">{stats.totalTracked}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {videos.map(v => (
          <div key={v.id} className="card card-interactive" style={{ 
            display: "flex", gap: "15px", alignItems: "flex-start",
            borderLeft: v.statusBorder === "red" ? "4px solid var(--danger)" : v.statusBorder === "yellow" ? "4px solid var(--warning)" : v.statusBorder === "green" ? "4px solid var(--success)" : "4px solid transparent"
          }}>
            <div className="video-thumb-wrapper" style={{ width: "160px", flexShrink: 0, borderRadius: "8px", position: "relative" }}>
              <img src={v.snippet?.thumbnails?.medium?.url} alt={v.snippet?.title} style={{ width: "100%", borderRadius: "8px" }} />
              {v.details?.isShort && (
                <div style={{ position: "absolute", top: "5px", left: "5px", background: "var(--danger)", color: "white", fontSize: "10px", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>
                  SHORTS
                </div>
              )}
              <div className="video-duration">{v.details?.duration}</div>
            </div>
            
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "16px", margin: "0 0 10px 0", color: "#fff" }}>{v.snippet?.title}</h3>
              <div style={{ display: "flex", gap: "15px", fontSize: "14px", color: "#888", marginBottom: "10px" }}>
                <span title="Visualizações">👁 {parseInt(v.details?.viewCount || "0").toLocaleString("pt-BR")}</span>
                <span title="Comentários">💬 {parseInt(v.details?.commentCount || "0").toLocaleString("pt-BR")} no YouTube</span>
                <span title="Status Local">✓ {v.localVerifiedCount} verificados</span>
              </div>
              
              <div style={{ display: "flex", gap: "10px" }}>
                <Link href={`/comments/${v.snippet?.resourceId?.videoId}`} className="btn btn-secondary btn-sm" style={{ display: "inline-block" }}>
                  Ver Todos os Comentários
                </Link>
                <a href={`https://www.youtube.com/watch?v=${v.snippet?.resourceId?.videoId}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                  Abrir no YouTube
                </a>
              </div>
            </div>
          </div>
        ))}

        {videos.length === 0 && !loading && (
          <div className="empty-state">Nenhum vídeo encontrado.</div>
        )}

        {loading && <div style={{ textAlign: "center", color: "#888" }}>Carregando vídeos...</div>}

        {nextPageToken && !loading && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button className="btn btn-ghost" onClick={() => loadVideos(nextPageToken)}>Carregar mais</button>
          </div>
        )}
      </div>

      <TemplateModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} />
    </div>
  );
}
