"use client";
import { useState, useEffect } from "react";
import LeadCard from "../components/LeadCard";
import LeadEditModal from "../components/LeadEditModal";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterInterest, setFilterInterest] = useState("");

  const tags = ["", "TRIAGEM", "FRIA", "MORNA", "QUENTE", "MUITO_QUENTE", "CONVERTIDO", "DESCARTADO"];
  const interests = ["", "CR", "POSSE", "ARMA", "OUTROS", "INDEFINIDO"];

  useEffect(() => {
    loadLeads();
  }, [filterTag, filterInterest]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      loadLeads();
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTag) params.append("tag", filterTag);
      if (filterInterest) params.append("interesse", filterInterest);
      if (search) params.append("search", search);

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) setLeads(await res.json());
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  const tagCounts = tags.filter(t => t !== "").reduce((acc, tag) => {
    acc[tag] = leads.filter(l => l.tag === tag).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Banco de <span>Leads</span></h1>
        <p className="page-subtitle">Gerencie o CRM de contatos gerados através dos comentários do YouTube.</p>
      </div>

      <div className="toolbar" style={{ display: "flex", gap: "15px", marginBottom: "30px", flexWrap: "wrap", background: "#161616", padding: "15px", borderRadius: "8px", border: "1px solid #333" }}>
        <input 
          type="text" 
          placeholder="Buscar por nome..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #444", background: "#222", color: "white", flex: 1, minWidth: "200px" }}
        />
        <select 
          value={filterTag} 
          onChange={(e) => setFilterTag(e.target.value)}
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #444", background: "#222", color: "white", minWidth: "150px" }}
        >
          <option value="">Todas as Temperaturas</option>
          {tags.filter(t => t !== "").map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select 
          value={filterInterest} 
          onChange={(e) => setFilterInterest(e.target.value)}
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #444", background: "#222", color: "white", minWidth: "150px" }}
        >
          <option value="">Todos os Interesses</option>
          {interests.filter(i => i !== "").map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {Object.entries(tagCounts).map(([tag, count]) => count > 0 ? (
          <span key={tag} style={{ fontSize: "12px", background: "#222", padding: "4px 8px", borderRadius: "4px", color: "#ccc", border: "1px solid #333" }}>
            {tag}: <strong style={{ color: "var(--accent)" }}>{count}</strong>
          </span>
        ) : null)}
      </div>

      {loading ? (
        <p>Carregando leads...</p>
      ) : (
        <div className="leads-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {leads.map(lead => (
            <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
          ))}
          {leads.length === 0 && (
            <div className="empty-state" style={{ gridColumn: "1 / -1" }}>Nenhum lead encontrado com estes filtros.</div>
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
