import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, Search, Loader2, Calendar, PhoneIncoming } from 'lucide-react';
import api from '../../services/api';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [calls, setCalls] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getCallsLog(200);
      setCalls(data);
    } catch (e) {
      console.error('Error loading calls log:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredCalls = calls.filter((c: any) => 
    c.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.performance && c.performance.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportCSV = () => {
    const headers = ["ID", "Agent", "Date", "Sentiment", "Score %", "Performance", "Motif Refus"];
    const rows = filteredCalls.map(c => [
      c.call_id,
      c.agent_name,
      c.call_date,
      c.sentiment,
      c.score_percentage,
      c.performance || "-",
      c.refusal_reason || "-"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rapport_crm_ai_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-muted-foreground">Extraction des logs MySQL...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2>Journal des Appels & Rapports</h2>
          <p className="text-muted-foreground mt-1">Exportez et analysez l'historique complet des interactions</p>
        </div>
        
        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-muted/20">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <PhoneIncoming className="w-4 h-4" />
            {filteredCalls.length} Appels trouvés
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Rechercher un agent ou une performance..." 
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-4 font-medium italic">ID</th>
                <th className="text-left p-4 font-medium">Agent</th>
                <th className="text-left p-4 font-medium">Date & Heure</th>
                <th className="text-left p-4 font-medium">Sentiment</th>
                <th className="text-left p-4 font-medium">Score Qualité</th>
                <th className="text-left p-4 font-medium">Performance</th>
                <th className="text-left p-4 font-medium">Coiffure Qualification</th>
              </tr>
            </thead>
            <tbody>
              {filteredCalls.map((c, i) => (
                <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-xs text-muted-foreground">#{c.call_id}</td>
                  <td className="p-4 font-semibold text-foreground">{c.agent_name}</td>
                  <td className="p-4 text-muted-foreground whitespace-nowrap">
                    {new Date(c.call_date).toLocaleString('fr-FR')}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.sentiment === 'POSITIVE' ? 'bg-success/10 text-success' : 
                      c.sentiment === 'NEGATIVE' ? 'bg-destructive/10 text-destructive' : 
                      'bg-muted text-muted-foreground'
                    }`}>
                      {c.sentiment}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <div className="w-12 h-1.5 bg-muted rounded-full">
                         <div className="h-full bg-primary rounded-full" style={{ width: `${c.score_percentage}%` }}></div>
                       </div>
                       <span className="font-bold">{c.score_percentage}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-foreground">{c.performance || "-"}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs ${c.qualification_match ? 'text-success' : 'text-warning font-medium'}`}>
                      {c.qualification_match ? "✅ Conforme" : "⚠️ Incohérent"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
