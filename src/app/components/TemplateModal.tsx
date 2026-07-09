"use client";
import { useState, useEffect } from "react";

export default function TemplateModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/templates");
      if (res.ok) setTemplates(await res.json());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!name || !content) return;
    try {
      const method = currentId ? "PUT" : "POST";
      const res = await fetch("/api/templates", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentId, name, content }),
      });
      if (res.ok) {
        setIsEditing(false);
        setCurrentId("");
        setName("");
        setContent("");
        loadTemplates();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este template?")) return;
    try {
      const res = await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
      if (res.ok) loadTemplates();
    } catch (e) {
      console.error(e);
    }
  };

  const openEdit = (t: any) => {
    setCurrentId(t.id);
    setName(t.name);
    setContent(t.content);
    setIsEditing(true);
  };

  const openNew = () => {
    setCurrentId("");
    setName("");
    setContent("");
    setIsEditing(true);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Gestão de Templates Globais</h2>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          {isEditing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input 
                type="text" 
                placeholder="Nome do Template" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                style={{ padding: "10px", borderRadius: "4px", border: "1px solid #333", background: "#161616", color: "white" }}
              />
              <textarea 
                placeholder="Conteúdo" 
                value={content} 
                onChange={e => setContent(e.target.value)} 
                rows={5}
                style={{ padding: "10px", borderRadius: "4px", border: "1px solid #333", background: "#161616", color: "white" }}
              />
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button className="btn btn-primary" onClick={handleSave}>Salvar</button>
                <button className="btn btn-ghost" onClick={() => setIsEditing(false)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "20px" }}>
                <button className="btn btn-primary btn-sm" onClick={openNew}>+ Novo Template</button>
              </div>
              {loading ? <p>Carregando...</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  {templates.length === 0 && <p className="empty-state">Nenhum template cadastrado.</p>}
                  {templates.map(t => (
                    <div key={t.id} style={{ background: "#1e1e1e", padding: "15px", borderRadius: "8px", border: "1px solid #333" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <strong style={{ color: "var(--accent)" }}>{t.name}</strong>
                        <div style={{ display: "flex", gap: "5px" }}>
                          <button className="btn-icon" onClick={() => openEdit(t)} title="Editar">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button className="btn-icon" onClick={() => handleDelete(t.id)} title="Excluir">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: "14px", color: "#ccc", whiteSpace: "pre-wrap", margin: 0 }}>{t.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
