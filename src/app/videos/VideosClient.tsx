"use client";
import { useState } from "react";
import Link from "next/link";

export default function VideosClient({ initialVideos, initialNextPageToken, uploadsPlaylistId }: any) {
  const [videos, setVideos] = useState<any[]>(initialVideos);
  const [nextPageToken, setNextPageToken] = useState(initialNextPageToken);
  const [activeTab, setActiveTab] = useState("videos");
  const [loading, setLoading] = useState(false);

  const filteredVideos = videos.filter((v: any) => 
    activeTab === "shorts" ? v.details?.isShort : !v.details?.isShort
  );

  const loadMore = async () => {
    if (!nextPageToken || loading || !uploadsPlaylistId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/videos?pageToken=${nextPageToken}&uploadsPlaylistId=${uploadsPlaylistId}`);
      if (res.ok) {
        const data = await res.json();
        setVideos(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newVideos = data.videos.filter((v: any) => !existingIds.has(v.id));
            return [...prev, ...newVideos];
        });
        setNextPageToken(data.nextPageToken);
      }
    } catch (error) {
      console.error("Failed to load more", error);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Galeria de <span>Vídeos</span></h1>
        <p className="page-subtitle">Navegue por todos os vídeos e shorts do canal com as principais métricas.</p>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === "videos" ? "active" : ""}`} onClick={() => setActiveTab("videos")}>Vídeos</button>
        <button className={`tab ${activeTab === "shorts" ? "active" : ""}`} onClick={() => setActiveTab("shorts")}>Shorts</button>
      </div>

      {videos.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum vídeo carregado. Faça login ou verifique a conexão.</p>
        </div>
      ) : (
        <>
          <div className="video-grid">
            {filteredVideos.map((item: any) => (
              <div key={item.id} className="video-card">
                <div className="video-thumb-wrapper">
                  <img src={item.snippet?.thumbnails?.medium?.url || ""} alt={item.snippet?.title} />
                  {item.details && (
                    <div className="video-duration">{item.details.duration}</div>
                  )}
                </div>
                <div className="video-info">
                  <h3 className="video-title" title={item.snippet?.title}>{item.snippet?.title}</h3>
                  <div className="video-meta">
                    <div className="video-meta-item" title="Visualizações">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      {parseInt(item.details?.viewCount || "0").toLocaleString("pt-BR")}
                    </div>
                    <div className="video-meta-item" title="Likes">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                      {parseInt(item.details?.likeCount || "0").toLocaleString("pt-BR")}
                    </div>
                    <Link href={`/comments/${item.snippet?.resourceId?.videoId}`} className="video-meta-item clickable" title="Comentários">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      {parseInt(item.details?.commentCount || "0").toLocaleString("pt-BR")}
                    </Link>
                  </div>
                  <div className="video-date">
                    {new Date(item.snippet?.publishedAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredVideos.length === 0 && (
             <div className="empty-state" style={{ padding: "40px 0" }}>
                <p>Nenhum {activeTab === "shorts" ? "Short" : "Vídeo"} encontrado nas páginas carregadas até agora.</p>
             </div>
          )}

          {nextPageToken && (
            <div className="flex justify-center mt-6">
              <button className="btn btn-secondary" onClick={loadMore} disabled={loading} style={{ padding: "12px 24px" }}>
                {loading ? "Carregando..." : "Carregar mais"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
