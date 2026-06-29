import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Users, Phone, Clock,
  Trophy, Target, Download, RefreshCw, Calendar,
  ArrowUp, ArrowDown, Activity, AlertTriangle,
  BarChart3, Brain, Zap, ArrowUpRight, FileText
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../../services/api';
import { useChartTheme } from '../../hooks/useChartTheme';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface KPIData {
  totalCalls: number;
  avgScore: number;
  conversionRate: number;
  activeAgents: number;
  callsToday: number;
  pendingFollowups: number;
  avgCallDuration: number;
}

interface ComparisonData {
  day: { current: any; previous: any; evolution: number; score_evol: number };
  week: { current: any; previous: any; evolution: number; score_evol: number };
  month: { current: any; previous: any; evolution: number; score_evol: number };
}

export default function DashboardPage() {
  const chartTheme = useChartTheme();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIData>({
    totalCalls: 0, avgScore: 0, conversionRate: 0,
    activeAgents: 0, callsToday: 0, pendingFollowups: 0, avgCallDuration: 0
  });
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState('today');
  const [chartData, setChartData] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  // Agent Management State
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [searchClient, setSearchClient] = useState("");
const [selectedAgent, setSelectedAgent] = useState("");
const [selectedProject, setSelectedProject] = useState("");
  const [formData, setFormData] = useState({
    username: '', password: '', name: '', role: 'agent', email: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewRes, agentsRes, comparisonRes, appointmentsRes] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getAgents(),
        api.getGlobalComparison(),
        api.getAppointments()
      ]);

      setKpis({
        totalCalls: overviewRes.total_calls || 0,
        avgScore: overviewRes.avg_score || 0,
        conversionRate: overviewRes.conversion_rate || 0,
        activeAgents: overviewRes.active_agents || 0,
        callsToday: overviewRes.calls_today || 0,
        pendingFollowups: overviewRes.pending_followups || 0,
        avgCallDuration: overviewRes.avg_duration || 0
      });

      setComparison(comparisonRes);
      console.log("COMPARISON =", comparisonRes);
      setAgents(agentsRes);
      setAppointments(Array.isArray(appointmentsRes) ? appointmentsRes : []);

      console.log("APPOINTMENTS =", appointmentsRes);

      if (overviewRes.hourly && overviewRes.hourly.length > 0) {
        setChartData(overviewRes.hourly.map((h: any) => ({
          name: `${h.hour}h`,
          calls: h.appels,
          convs: Math.round(h.appels * 0.3)
        })));
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!comparison) {
      alert('Aucune donnée disponible pour générer le PDF');
      return;
    }

    setExporting(true);
    try {
      const doc = new jsPDF();
      const now = new Date().toLocaleString('fr-FR');

      // Title
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59);
      doc.text("RAPPORT DE PERFORMANCE CRM AI", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Genere le : ${now}`, 14, 30);
      doc.text("Analyse comparative de l'activite du centre", 14, 35);

      // Summary Table
      const tableData = [
        ["Periode", "Appels (Actuel)", "Evolution", "Score Moyen", "Evol. Score"],
        ["Aujourd'hui", comparison.day.current.total, `${comparison.day.evolution}%`, `${comparison.day.current.avg_score}%`, `${comparison.day.score_evol}%`],
        ["Cette Semaine", comparison.week.current.total, `${comparison.week.evolution}%`, `${comparison.week.current.avg_score}%`, `${comparison.week.score_evol}%`],
        ["Ce Mois", comparison.month.current.total, `${comparison.month.evolution}%`, `${comparison.month.current.avg_score}%`, `${comparison.month.score_evol}%`],
      ];

      (doc as any).autoTable({
        startY: 45,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'grid',
        headStyles: { fillStyle: '#6366f1', textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      // Agents Performance
      if (agents.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(30, 41, 59);
        doc.text("Performance par Agent", 14, (doc as any).lastAutoTable.finalY + 15);

        const agentTableData = agents.map((a: any) => [
          a.name || a.username || 'N/A',
          a.role || 'agent',
          `${a.score || 70}%`,
          "Bon"
        ]);

        (doc as any).autoTable({
          startY: (doc as any).lastAutoTable.finalY + 5,
          head: [["Nom", "Role", "Score", "Statut"]],
          body: agentTableData,
          theme: 'striped',
        });
      }

      doc.save(`Rapport_Performance_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Erreur lors de la generation du PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleEdit = (agent: any) => {
    setEditingAgent(agent);
    setFormData({
      username: agent.username,
      password: '',
      name: agent.name,
      role: agent.role,
      email: agent.email || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet agent ?')) return;
    try {
      await api.deleteUser(userId);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingAgent) {
        await api.updateUser(editingAgent.id, formData);
      } else {
        await api.createUser(formData);
      }
      setShowModal(false);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };
  const filteredAppointments = appointments.filter((item: any) => {

  const clientMatch =
    item.client_name
      ?.toLowerCase()
      .includes(searchClient.toLowerCase());

  const agentMatch =
    selectedAgent === "" ||
    item.agent_name === selectedAgent;

  const projectMatch =
    selectedProject === "" ||
    item.project_type === selectedProject;

  return clientMatch && agentMatch && projectMatch;
});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Vue d'ensemble <span className="text-primary">Dashboard</span>
          </h1>

        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={generatePDF}
            disabled={exporting || loading}
            className="h-10 px-4 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generation...
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                Export PDF
              </>
            )}
          </button>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-10 px-4 bg-slate-800 border border-border rounded-xl text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="today" className="text-slate-900">Aujourd'hui</option>
            <option value="week" className="text-slate-900">Cette semaine</option>
            <option value="month" className="text-slate-900">Ce mois</option>
          </select>
          <button
            onClick={fetchDashboardData}
            className="p-2.5 bg-card border border-border rounded-xl hover:bg-muted transition-all text-primary"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Appels Totaux', value: kpis.totalCalls, icon: Phone, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Score Moyen', value: `${kpis.avgScore}%`, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Conversion', value: `${kpis.conversionRate}%`, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Agents Actifs', value: kpis.activeAgents, icon: Users, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        ].map((kpi, i) => (
          <div key={i} className="bg-card border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-3 ${kpi.color}`}>
              <kpi.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-foreground">{loading ? '...' : kpi.value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{kpi.label}</div>
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
              <kpi.icon className="w-16 h-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {comparison && [
          { title: 'Aujourd\'hui vs Hier', period: comparison.day },
          { title: 'Cette Semaine vs Précédente', period: comparison.week },
          { title: 'Ce Mois vs Précédent', period: comparison.month },
        ].map((item, i) => (
          <div key={i} className="bg-card border border-border p-4 rounded-2xl shadow-sm">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">{item.title}</h4>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-black text-foreground">{item.period?.current?.total ?? 0} appels</div>
                <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${item.period.evolution >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {item.period.evolution >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {item.period.evolution > 0 ? '+' : ''}{item.period?.evolution ?? 0}% volume
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-primary">{item.period?.current?.avg_score ?? 0}%</div>
                <div className={`text-[10px] font-bold mt-1 ${item.period.score_evol >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {item.period.score_evol > 0 ? '+' : ''}{item.period?.score_evol ?? 0}% qualité
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Activité vs Conversions</h3>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest opacity-50">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-primary rounded-full" /> Appels</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> RDV</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: chartTheme.textColor }} axisLine={false} tickLine={false} stroke={chartTheme.textColor} />
              <YAxis tick={{ fontSize: 10, fill: chartTheme.textColor }} axisLine={false} tickLine={false} stroke={chartTheme.textColor} />
              <Tooltip contentStyle={chartTheme.tooltipStyle} />
              <Area type="monotone" dataKey="calls" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#colorCalls)" />
              <Area type="monotone" dataKey="convs" stroke="#10b981" strokeWidth={3} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights Sidebar */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">AI Intelligence</h3>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Prédiction</p>
                <p className="text-xs font-medium leading-relaxed">Pic d'appels prévu demain à 14:00. Prévoyez 2 agents supplémentaires.</p>
              </div>
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Performance</p>
                <p className="text-xs font-medium leading-relaxed">Taux de conversion en hausse de 4% ce matin. Très bonne dynamique d'équipe.</p>
              </div>
              <button
                onClick={() => {
                  const report = `Rapport IA du ${new Date().toLocaleDateString('fr-FR')} :
                     - Total Appels: ${kpis.totalCalls}
                     - Meilleur Agent: ${agents.length > 0 ? agents.sort((a, b) => (b.score || 0) - (a.score || 0))[0].name : 'N/A'}
                     - Pic d'activité: ${chartData.length > 0 ? chartData.sort((a, b) => b.calls - a.calls)[0].name : 'N/A'}
                     - Recommandation: Concentrer les effectifs sur le créneau de l'après-midi.`;
                  alert(report);
                }}
                className="w-full py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                Générer Rapport IA <Zap className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex-1">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Récapitulatif Rapide</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">Appels Aujourd'hui</span>
                <span className="text-xs font-black">{kpis.callsToday}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">Durée Moyenne</span>
                <span className="text-xs font-black">{kpis.avgCallDuration} min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">Relances en attente</span>
                <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded text-[10px] font-black uppercase">{kpis.pendingFollowups}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Management Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">HISTORIQUE PRODUCTION</h3>
          </div>
          <div className="flex gap-3">

  <input
    type="text"
    placeholder="🔍 Rechercher client..."
    value={searchClient}
    onChange={(e) => setSearchClient(e.target.value)}
    className="px-4 py-2 rounded-xl border border-border bg-background"
  />

  <select
    value={selectedAgent}
    onChange={(e) => setSelectedAgent(e.target.value)}
    className="px-4 py-2 rounded-xl border border-border bg-background"
  >
    <option value="">Tous les agents</option>

    {[...new Set(
      appointments.map((a: any) => a.agent_name)
    )].map((agent: any) => (
      <option key={agent} value={agent}>
        {agent}
      </option>
    ))}
  </select>

  <select
    value={selectedProject}
    onChange={(e) => setSelectedProject(e.target.value)}
    className="px-4 py-2 rounded-xl border border-border bg-background"
  >
    <option value="">Tous les projets</option>

    {[...new Set(
      appointments.map((a: any) => a.project_type)
    )].map((project: any) => (
      <option key={project} value={project}>
        {project}
      </option>
    ))}
  </select>

</div>
         
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/10 border-b border-border">

                <th className="px-4 py-3 text-left">GSM</th>

                <th className="px-4 py-3 text-left">Client</th>

                <th className="px-4 py-3 text-left">Projet</th>

                <th className="px-4 py-3 text-left">Date RDV</th>

                <th className="px-4 py-3 text-left">Heure</th>

                <th className="px-4 py-3 text-left">Agent</th>

                <th className="px-4 py-3 text-left">Statut</th>

              </tr>
            </thead>
            <tbody className="divide-y divide-border">

              {filteredAppointments.map((item: any, index: number) => (

                <tr
                  key={item.id || index}
                  className="hover:bg-muted/20 transition-colors"
                >

                  <td className="px-4 py-4">
                    {item.client_phone}
                  </td>

                  <td className="px-4 py-4 font-semibold">
                    {item.client_name}
                  </td>

                  <td className="px-4 py-4">
                    {item.project_type}
                  </td>

                  <td className="px-4 py-4">
                    {item.appointment_date}
                  </td>

                  <td className="px-4 py-4">
                    {item.appointment_time}
                  </td>

                  <td className="px-4 py-4">
                    {item.agent_name}
                  </td>

                  <td className="px-4 py-4">

                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === "confirme"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : item.status === "refus"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                    >
                      {item.status}
                    </span>

                  </td>

                </tr>

              ))}

            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-100 dark:bg-slate-800 dark:bg-slate-800/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
                {editingAgent ? 'Modifier l\'agent' : 'Ajouter un agent'}
              </h3>
            </div>
            <div className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nom complet</label>
                  <input
                    className="w-full px-4 py-2.5 bg-indigo-950/40 text-white placeholder:text-slate-400 border-primary/20 border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Jean Dupont"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Login (Pseudo)</label>
                  <input
                    className="
w-full
px-4
py-3
bg-indigo-950/40
border
border-primary/20
rounded-2xl
text-white
text-sm
font-bold
placeholder:text-slate-400
backdrop-blur-md
focus:ring-2
focus:ring-primary/40
focus:border-primary
outline-none
transition-all
duration-300
"
                    placeholder="jdupont"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email professionnel</label>
                <input
                  type="email"
                  className="
w-full
px-4
py-3
bg-indigo-950/40
border
border-primary/20
rounded-2xl
text-white
text-sm
font-bold
placeholder:text-slate-400
caret-primary
backdrop-blur-md
focus:ring-2
focus:ring-primary/40
focus:border-primary
outline-none
transition-all
duration-300
"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mot de passe</label>
                <input
                  type="password"
                  className="
w-full
px-4
py-3
bg-indigo-950/40
border
border-primary/20
rounded-2xl
text-white
text-sm
font-bold
placeholder:text-slate-400
caret-primary
backdrop-blur-md
focus:ring-2
focus:ring-primary/40
focus:border-primary
outline-none
transition-all
duration-300
"
                  placeholder={editingAgent ? "•••••••• (vide pour garder)" : "8 caractères min."}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Rôle système</label>
                <select
                  className="
w-full
px-4
py-3
bg-indigo-950/40
border
border-primary/20
rounded-2xl
text-white
text-sm
font-bold
outline-none
cursor-pointer
focus:ring-2
focus:ring-primary/40
transition-all
duration-300
"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="agent">Conseiller Client (Agent)</option>
                  <option value="qualite">Service Qualité (Superviseur)</option>
                  <option value="admin">Administrateur Système</option>
                </select>
              </div>
            </div>
            <div className="p-6 bg-muted/20 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted rounded-xl transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
              >
                {editingAgent ? 'Sauvegarder' : 'Créer l\'agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}