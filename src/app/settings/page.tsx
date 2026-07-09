"use client";

export default function SettingsPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Configurações do <span>Sistema</span></h1>
        <p className="page-subtitle">Gerencie as preferências globais do seu dashboard.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="card" style={{ background: "#161616", border: "1px solid #333" }}>
          <h3 style={{ color: "var(--accent)", marginBottom: "15px" }}>Canal Monitorado</h3>
          <div style={{ color: "#ccc", fontSize: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <p><strong>ID do Canal:</strong> <span style={{ fontFamily: "monospace", background: "#222", padding: "4px 8px", borderRadius: "4px" }}>UCfIHSZPt-yQ5foOm7NscflQ</span></p>
            <p>A sincronização com o YouTube Data API é automática para este canal.</p>
          </div>
        </div>

        <div className="card" style={{ background: "#161616", border: "1px solid #333" }}>
          <h3 style={{ color: "var(--accent)", marginBottom: "15px" }}>E-mails Autorizados</h3>
          <div style={{ color: "#ccc", fontSize: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <p>O acesso a este painel é restrito aos emails listados na whitelist.</p>
            <p>Para adicionar novos usuários, atualize a variável <code>WHITELIST_EMAILS</code> no ambiente do servidor.</p>
          </div>
        </div>

        <div className="card" style={{ background: "#161616", border: "1px solid #333" }}>
          <h3 style={{ color: "var(--accent)", marginBottom: "15px" }}>Sincronização</h3>
          <div style={{ color: "#ccc", fontSize: "14px", display: "flex", flexDirection: "column", gap: "15px" }}>
            <p>A sincronização dos dados ocorre em tempo real sempre que você carrega as páginas. O cache local para vídeos ajuda a otimizar a velocidade.</p>
            <div>
              <button className="btn btn-secondary" disabled>Sincronizar Manualmente (Breve)</button>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: "#161616", border: "1px solid #333" }}>
          <h3 style={{ color: "var(--accent)", marginBottom: "15px" }}>Sobre o Dashboard</h3>
          <div style={{ color: "#ccc", fontSize: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <p><strong>Versão:</strong> 2.0.0-beta</p>
            <p>Desenvolvido para gerenciamento inteligente de comunidade do YouTube. Com integração completa de API v3, autenticação OAuth Google e banco de dados SQLite.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
