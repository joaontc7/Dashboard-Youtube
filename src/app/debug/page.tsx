"use client";
import { useState, useEffect } from "react";

export default function DebugPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/debug/status");
      if (res.ok) setStatus(await res.json());
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/debug/sync-all", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        alert(`Sincronização concluída com sucesso! ${data.videosCount} vídeos processados e ${data.commentsSynced} status de comentários atualizados.`);
        loadStatus();
      } else {
        alert("Falha na sincronização.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao sincronizar.");
    }
    setSyncing(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Debug & <span>Status</span></h1>
        <p className="page-subtitle">Ferramentas de diagnóstico para desenvolvedores.</p>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button className="btn btn-ghost" onClick={loadStatus} disabled={loading || syncing}>
          {loading ? "Atualizando..." : "Atualizar Status"}
        </button>
      </div>

      {loading && !status && <p>Carregando informações do sistema...</p>}

      {status && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div className="card" style={{ background: "#161616", border: "1px solid #333" }}>
            <h3 style={{ color: "var(--accent)", marginBottom: "15px" }}>Status da API (YouTube)</h3>
            <div style={{ fontFamily: "monospace", fontSize: "13px", color: status.api.youtube.includes("Conectado") ? "var(--success)" : "var(--error)", background: "#222", padding: "10px", borderRadius: "4px" }}>
              {status.api.youtube}
            </div>
          </div>

          <div className="card" style={{ background: "#161616", border: "1px solid #333" }}>
            <h3 style={{ color: "var(--accent)", marginBottom: "15px" }}>Banco de Dados (SQLite Prisma)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div style={{ background: "#222", padding: "10px", borderRadius: "4px" }}>
                <div style={{ color: "#888", fontSize: "12px" }}>Leads Armazenados</div>
                <div style={{ fontSize: "20px", color: "white" }}>{status.db.leads}</div>
              </div>
              <div style={{ background: "#222", padding: "10px", borderRadius: "4px" }}>
                <div style={{ color: "#888", fontSize: "12px" }}>Templates Cadastrados</div>
                <div style={{ fontSize: "20px", color: "white" }}>{status.db.templates}</div>
              </div>
              <div style={{ background: "#222", padding: "10px", borderRadius: "4px" }}>
                <div style={{ color: "#888", fontSize: "12px" }}>Comentários Rastreados (Status)</div>
                <div style={{ fontSize: "20px", color: "white" }}>{status.db.commentStatuses}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ background: "#161616", border: "1px solid #333" }}>
            <h3 style={{ color: "var(--accent)", marginBottom: "15px" }}>Ações do Sistema</h3>
            <div style={{ display: "flex", gap: "15px" }}>
              <button className="btn btn-secondary" onClick={handleSyncAll} disabled={syncing} style={{ flex: 1 }}>
                {syncing ? "Sincronizando Histórico..." : "Forçar Sincronização Total"}
              </button>
              <button className="btn btn-danger" onClick={() => alert("Função em desenvolvimento")} style={{ flex: 1 }}>Limpar Cache de Vídeos</button>
            </div>
          </div>

          <div className="card" style={{ background: "#161616", border: "1px solid #333" }}>
            <h3 style={{ color: "var(--accent)", marginBottom: "15px" }}>Informações do Sistema</h3>
            <div style={{ color: "#ccc", fontSize: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <p><strong>Node Version:</strong> <span style={{ fontFamily: "monospace" }}>{status.system.nodeVersion}</span></p>
              <p><strong>Sessão Atual:</strong> <span style={{ fontFamily: "monospace" }}>{status.system.sessionUser}</span></p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
