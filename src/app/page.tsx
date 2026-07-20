"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import LeadCard from "./components/LeadCard";
import LeadEditModal from "./components/LeadEditModal";
import Link from "next/link";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("visao");
  const [stats, setStats] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const resStats = await fetch("/api/dashboard/stats");
      if (resStats.status === 401) {
        alert("Sua sessão do Google expirou (ou você não está logado). Por favor, saia e entre novamente no sistema para renovar a conexão com o YouTube.");
        window.location.href = "/api/auth/signin";
        return;
      }
      if (!resStats.ok) {
         const err = await resStats.json().catch(() => ({}));
         throw new Error(err.error || `Erro HTTP ${resStats.status} ao carregar métricas.`);
      }
      setStats(await resStats.json());
      
      const resLeads = await fetch("/api/leads");
      if (resLeads.ok) setLeads(await resLeads.json());
    } catch(e: any) {
      console.error(e);
      setErrorMsg(e.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Bem-vindo ao <span>Iron Masters Dashboard</span></h1>
        <p className="page-subtitle">Acompanhe o crescimento do canal e gerencie seus leads.</p>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === "visao" ? "active" : ""}`} onClick={() => setActiveTab("visao")}>Visão Geral</button>
        <button className={`tab ${activeTab === "leads" ? "active" : ""}`} onClick={() => setActiveTab("leads")}>Banco de Leads Recentes</button>
      </div>

      {loading && <p>Carregando dados...</p>}
      
      {errorMsg && (
        <div style={{ padding: "20px", background: "#3a1c1c", border: "1px solid #ff4444", borderRadius: "8px", color: "#ff8888", marginBottom: "20px" }}>
          <strong>Ocorreu um erro ao buscar os dados:</strong> {errorMsg}
          <br /><br />
          <em>Tente sair da sua conta (clicando em "Sair" na lateral) e fazer o login novamente.</em>
        </div>
      )}

      {!loading && activeTab === "visao" && stats && (
        <>
          <div className="stat-grid" style={{ marginBottom: "30px" }}>
            <div className="stat-card">
              <div className="stat-label">Inscritos Totais</div>
              <div className="stat-value">{parseInt(stats.subscriberCount).toLocaleString("pt-BR")}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Visualizações Totais</div>
              <div className="stat-value">{parseInt(stats.viewCount).toLocaleString("pt-BR")}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Vídeos Publicados</div>
              <div className="stat-value">{parseInt(stats.videoCount).toLocaleString("pt-BR")}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Média Views/Vídeo</div>
              <div className="stat-value">{stats.avgViewsPerVideo.toLocaleString("pt-BR")}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Comentários s/ Resposta</div>
              <div className="stat-value" style={{ color: stats.unrespondedCount === 0 ? "var(--success)" : "var(--warning)" }}>
                {stats.unrespondedCount}
              </div>
            </div>
          </div>

          <div className="chart-container" style={{ background: "#161616", padding: "20px", borderRadius: "12px", border: "1px solid #333" }}>
            <h3 className="chart-title" style={{ marginBottom: "20px", color: "#fff" }}>Desempenho dos Últimos 10 Vídeos</h3>
            <div style={{ height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.recentVideos}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis 
                    dataKey="title" 
                    tick={{ fill: "#666", fontSize: 12 }}
                    tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + "..." : val}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: "#666", fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => val > 1000 ? (val/1000).toFixed(1) + "k" : val}
                  />
                  <Tooltip 
                    contentStyle={{ background: "#222", border: "1px solid #444", borderRadius: "8px", color: "#fff" }}
                    itemStyle={{ color: "var(--accent)" }}
                    cursor={{ fill: "#2a2a2a" }}
                  />
                  <Bar dataKey="viewCount" name="Views" fill="var(--accent)" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {!loading && activeTab === "leads" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
            <h3 style={{ margin: 0, color: "#fff" }}>Leads Recentes</h3>
            <Link href="/leads" className="btn btn-secondary">Ver CRM Completo</Link>
          </div>
          <div className="leads-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {leads.slice(0, 6).map(lead => (
              <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
            ))}
            {leads.length === 0 && <p className="empty-state">Nenhum lead encontrado.</p>}
          </div>
        </div>
      )}

      <LeadEditModal 
        isOpen={!!selectedLead} 
        onClose={() => setSelectedLead(null)} 
        lead={selectedLead} 
        onSave={loadData} 
      />
    </div>
  );
}
