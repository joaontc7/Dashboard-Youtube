"use client";
import { useState, useEffect } from "react";

export default function LeadEditModal({ isOpen, onClose, lead, onSave }: { isOpen: boolean, onClose: () => void, lead: any, onSave: () => void }) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormData({
        id: lead.id,
        displayName: lead.displayName || "",
        tag: lead.tag || "TRIAGEM",
        interesse: lead.interesse || "INDEFINIDO",
        whatsapp: lead.whatsapp || "",
        email: lead.email || "",
        notes: lead.notes || ""
      });
    }
  }, [lead]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const tags = ["TRIAGEM", "FRIA", "MORNA", "QUENTE", "MUITO_QUENTE", "CONVERTIDO", "DESCARTADO"];
  const interests = ["CR", "POSSE", "ARMA", "OUTROS", "INDEFINIDO"];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Editar Lead</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px", padding: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", color: "#ccc" }}>Nome de Exibição</label>
            <input type="text" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} style={{ width: "100%", padding: "10px", background: "#161616", border: "1px solid #333", color: "#fff", borderRadius: "4px" }} />
          </div>

          <div style={{ display: "flex", gap: "15px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#ccc" }}>Temperatura (Tag)</label>
              <select value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})} style={{ width: "100%", padding: "10px", background: "#161616", border: "1px solid #333", color: "#fff", borderRadius: "4px" }}>
                {tags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#ccc" }}>Interesse</label>
              <select value={formData.interesse} onChange={e => setFormData({...formData, interesse: e.target.value})} style={{ width: "100%", padding: "10px", background: "#161616", border: "1px solid #333", color: "#fff", borderRadius: "4px" }}>
                {interests.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "15px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#ccc" }}>WhatsApp</label>
              <input type="text" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="+55..." style={{ width: "100%", padding: "10px", background: "#161616", border: "1px solid #333", color: "#fff", borderRadius: "4px" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#ccc" }}>E-mail</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: "100%", padding: "10px", background: "#161616", border: "1px solid #333", color: "#fff", borderRadius: "4px" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "5px", color: "#ccc" }}>Anotações</label>
            <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} style={{ width: "100%", padding: "10px", background: "#161616", border: "1px solid #333", color: "#fff", borderRadius: "4px" }} />
          </div>

          {lead?.comments && lead.comments.length > 0 && (
            <div style={{ borderTop: "1px solid #333", paddingTop: "15px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "var(--accent-light)", fontWeight: "bold" }}>Comentários no YouTube ({lead.comments.length})</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
                {lead.comments.map((lc: any) => (
                  <div key={lc.id} style={{ background: "#222", padding: "10px 12px", borderRadius: "6px", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ flex: 1 }}>
                      {lc.videoTitle && <div style={{ color: "#888", fontSize: "11px", marginBottom: "3px" }}>📹 {lc.videoTitle}</div>}
                      <div style={{ color: "#eee", lineHeight: "1.4" }}>"{lc.commentText}"</div>
                      <div style={{ fontSize: "10px", color: "#666", marginTop: "4px" }}>{new Date(lc.commentDate).toLocaleDateString("pt-BR")}</div>
                    </div>
                    <a
                      href={`https://www.youtube.com/watch?v=${lc.videoId}&lc=${lc.commentId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "11px", padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: "4px", flexShrink: 0 }}
                      title="Ver este comentário no YouTube"
                    >
                      <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      Ver no YouTube ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Salvando..." : "Salvar Alterações"}</button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
