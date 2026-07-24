"use client";

export default function LeadCard({ lead, onClick }: { lead: any, onClick: () => void }) {
  const getTagColor = (tag: string) => {
    switch(tag) {
      case "TRIAGEM": return "var(--info)";
      case "FRIA": return "#6c757d";
      case "MORNA": return "var(--warning)";
      case "QUENTE": return "#fd7e14";
      case "MUITO_QUENTE": return "var(--danger)";
      case "CONVERTIDO": return "var(--success)";
      case "DESCARTADO": return "#343a40";
      default: return "#6c757d";
    }
  };

  const getInterestColor = (interest: string) => {
    switch(interest) {
      case "CR": return "#0d6efd";
      case "POSSE": return "#6f42c1";
      case "ARMA": return "#d63384";
      case "OUTROS": return "#20c997";
      case "INDEFINIDO": return "#adb5bd";
      default: return "#adb5bd";
    }
  };

  return (
    <div className="card card-interactive" onClick={onClick} style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        {lead.avatarUrl ? (
          <img src={lead.avatarUrl} alt={lead.displayName} style={{ width: "50px", height: "50px", borderRadius: "50%" }} />
        ) : (
          <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold" }}>
            {lead.displayName?.charAt(0) || "?"}
          </div>
        )}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <h3 style={{ margin: 0, fontSize: "16px", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lead.displayName}</h3>
          <div style={{ fontSize: "12px", color: "#888" }}>@{lead.youtubeUsername}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ background: getTagColor(lead.tag), color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>
          {lead.tag}
        </span>
        <span style={{ background: getInterestColor(lead.interesse), color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>
          {lead.interesse}
        </span>
      </div>

      {(lead.whatsapp || lead.email) && (
        <div style={{ marginTop: "10px", fontSize: "13px", color: "#ccc", borderTop: "1px solid #333", paddingTop: "10px" }}>
          {lead.whatsapp && <div>📱 {lead.whatsapp}</div>}
          {lead.email && <div>✉️ {lead.email}</div>}
        </div>
      )}

      {lead.notes && (
        <div style={{ marginTop: "10px", fontSize: "13px", color: "#888", fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {lead.notes}
        </div>
      )}

      {lead.comments && lead.comments.length > 0 && (
        <div style={{ marginTop: "10px", borderTop: "1px solid #333", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "11px", color: "var(--accent-light)", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            💬 Comentário{lead.comments.length > 1 ? "s" : ""} ({lead.comments.length}):
          </div>
          {lead.comments.map((lc: any) => (
            <div key={lc.id || lc.commentId} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #282828", borderRadius: "6px", padding: "8px 10px", fontSize: "12px" }}>
              <div style={{ color: "#d0d0d0", fontStyle: "italic", marginBottom: "6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                "{lc.commentText}"
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "10px", color: "#777" }}>
                  {new Date(lc.commentDate).toLocaleDateString("pt-BR")}
                </span>
                <a
                  href={`https://www.youtube.com/watch?v=${lc.videoId}&lc=${lc.commentId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: "11px", padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--accent-light)" }}
                  title="Ver este comentário no YouTube"
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                  Ver no YouTube ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
