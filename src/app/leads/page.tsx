"use client";
import { useState, useEffect, useMemo } from "react";
import LeadCard from "../components/LeadCard";
import LeadEditModal from "../components/LeadEditModal";

export default function LeadsPage() {
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterInterest, setFilterInterest] = useState("");

  const tags = ["TRIAGEM", "FRIA", "MORNA", "QUENTE", "MUITO_QUENTE", "CONVERTIDO", "DESCARTADO"];
  const interests = ["CR", "POSSE", "ARMA", "OUTROS", "INDEFINIDO"];

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      if (res.ok) setAllLeads(await res.json());
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  // Compute total counts per tag dynamically
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = { TODAS: allLeads.length };
    tags.forEach(tag => {
      counts[tag] = allLeads.filter(l => l.tag === tag).length;
    });
    return counts;
  }, [allLeads]);

  // Filter leads in memory for instant tab switching
  const filteredLeads = useMemo(() => {
    return allLeads.filter(l => {
      if (filterTag && l.tag !== filterTag) return false;
      if (filterInterest && l.interesse !== filterInterest) return false;
      if (search) {
        const query = search.toLowerCase();
        const nameMatch = (l.displayName || "").toLowerCase().includes(query);
        const userMatch = (l.youtubeUsername || "").toLowerCase().includes(query);
        const noteMatch = (l.notes || "").toLowerCase().includes(query);
        if (!nameMatch && !userMatch && !noteMatch) return false;
      }
      return true;
    });
  }, [allLeads, filterTag, filterInterest, search]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Banco de <span>Leads</span></h1>
        <p className="page-subtitle">Gerencie o CRM de contatos cadastrados automaticamente quando um comentário é respondido por você no YouTube.</p>
      </div>

      {/* Navegação por Tabs de Temperatura */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "25px", flexWrap: "wrap", borderBottom: "1px solid #333", paddingBottom: "15px" }}>
        <button
          onClick={() => setFilterTag("")}
          className="btn btn-sm"
          style={{
            background: filterTag === "" ? "var(--accent)" : "#161616",
            color: filterTag === "" ? "#fff" : "#aaa",
            border: filterTag === "" ? "1px solid var(--accent)" : "1px solid #333",
            fontWeight: "bold",
            padding: "8px 14px",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          TODOS ({tagCounts.TODAS || 0})
        </button>

        {tags.map(tag => {
          const isActive = filterTag === tag;
          const count = tagCounts[tag] || 0;
          return (
            <button
              key={tag}
              onClick={() => setFilterTag(isActive ? "" : tag)}
              className="btn btn-sm"
              style={{
                background: isActive ? "rgba(134, 104, 93, 0.3)" : "#161616",
                color: isActive ? "var(--accent-light)" : count > 0 ? "#eee" : "#666",
                border: isActive ? "1px solid var(--accent)" : "1px solid #333",
                fontWeight: isActive ? "bold" : "normal",
                padding: "8px 14px",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              {tag}
              <span style={{ 
                background: isActive ? "var(--accent)" : count > 0 ? "#333" : "#222", 
                color: isActive ? "#fff" : count > 0 ? "var(--accent-light)" : "#555",
                padding: "2px 7px", 
                borderRadius: "10px", 
                fontSize: "11px" 
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filtros Secundários: Busca por texto e Filtro de Interesse */}
      <div className="toolbar" style={{ display: "flex", gap: "15px", marginBottom: "30px", flexWrap: "wrap", background: "#161616", padding: "15px", borderRadius: "8px", border: "1px solid #333" }}>
        <input 
          type="text" 
          placeholder="Buscar por nome, @usuario ou anotações..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #444", background: "#222", color: "white", flex: 1, minWidth: "220px" }}
        />
        <select 
          value={filterInterest} 
          onChange={(e) => setFilterInterest(e.target.value)}
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #444", background: "#222", color: "white", minWidth: "180px" }}
        >
          <option value="">Todos os Interesses</option>
          {interests.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#888", padding: "40px 0" }}>Carregando leads...</p>
      ) : (
        <div className="leads-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {filteredLeads.map(lead => (
            <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
          ))}
          {filteredLeads.length === 0 && (
            <div className="empty-state" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 0", color: "#888" }}>
              Nenhum lead encontrado para esta aba/filtro.
            </div>
          )}
        </div>
      )}

      <LeadEditModal 
        isOpen={!!selectedLead} 
        onClose={() => setSelectedLead(null)} 
        lead={selectedLead} 
        onSave={loadLeads} 
      />
    </div>
  );
}
