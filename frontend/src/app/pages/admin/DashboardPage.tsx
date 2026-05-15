import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Users, Phone, Clock, 
  Trophy, Target, Download, RefreshCw, Calendar,
  ArrowUp, ArrowDown, Activity, AlertTriangle,
  BarChart3, Brain, Zap, ArrowUpRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../../services/api';
import { useChartTheme } from '../../hooks/useChartTheme';

interface KPIData {
  totalCalls: number;
  avgScore: number;
  conversionRate: number;
  activeAgents: number;
  callsToday: number;
  pendingFollowups: number;
  avgCallDuration: number;
}

interface AgentPerf {
  id: number;
  name: string;
  calls: number;
  score: number;
  conversion: number;
  trend: 'up' | 'down' | 'stable';
  sentiment: number;
}

const DASHBOARD_CHART_DATA = [
  { name: 'Lun', calls: 40, convs: 24 },
  { name: 'Mar', calls: 30, convs: 13 },
  { name: 'Mer', calls: 20, convs: 98 },
  { name: 'Jeu', calls: 27, convs: 39 },
  { name: 'Ven', calls: 18, convs: 48 },
  { name: 'Sam', calls: 23, convs: 38 },
  { name: 'Dim', calls: 34, convs: 43 },
];

export default function DashboardPage() {
  const chartTheme = useChartTheme();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIData>({
    totalCalls: 1247, avgScore: 78, conversionRate: 42,
    activeAgents: 12, callsToday: 89, pendingFollowups: 23, avgCallDuration: 4.2
  });
  const [agents, setAgents] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState('today');
  const [chartData, setChartData] = useState<any[]>(DASHBOARD_CHART_DATA);

  // Agent Management State
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '', password: '', name: '', role: 'agent', email: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const overviewRes = await api.getAnalyticsOverview();
      setKpis({
        totalCalls: overviewRes.total_calls || 0,
        avgScore: overviewRes.avg_score || 0,
        conversionRate: overviewRes.conversion_rate || 0, // Backend needs to provide this
        activeAgents: overviewRes.active_agents || 0, // Backend needs to provide this
        callsToday: overviewRes.calls_today || 0, // Backend needs to provide this
        pendingFollowups: overviewRes.pending_followups || 0,
        avgCallDuration: overviewRes.avg_duration || 0
      });
      
      if (overviewRes.hourly && overviewRes.hourly.length > 0) {
        setChartData(overviewRes.hourly.map((h: any) => ({
          name: `${h.hour}h`,
          calls: h.appels,
          convs: Math.round(h.appels * 0.3) // Mock conversions if not in hourly
        })));
      }

      // Fetch real agents list
      const agentRes = await api.getAgents();
      setAgents(agentRes);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (agent: any) => {
    setEditingAgent(agent);
    setFormData({
      username: agent.username,
      password: '', // Hidden for security
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Vue d'ensemble <span className="text-primary">Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Analyse de la performance globale et KPIs critiques</p>
        </div>
        <div className="flex items-center gap-3">
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
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 10, fill: chartTheme.textColor}} axisLine={false} tickLine={false} stroke={chartTheme.textColor} />
              <YAxis tick={{fontSize: 10, fill: chartTheme.textColor}} axisLine={false} tickLine={false} stroke={chartTheme.textColor} />
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
                     - Meilleur Agent: ${agents.length > 0 ? agents.sort((a,b) => (b.score||0)-(a.score||0))[0].name : 'N/A'}
                     - Pic d'activité: ${chartData.length > 0 ? chartData.sort((a,b) => b.calls - a.calls)[0].name : 'N/A'}
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
             <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Gestion des Agents</h3>
          </div>
          <button 
            onClick={() => {
              setEditingAgent(null);
              setFormData({ username: '', password: '', name: '', role: 'agent', email: '' });
              setShowModal(true);
            }}
            className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Users className="w-3 h-3" />
            Nouvel Agent
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/10 text-left border-b border-border">
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nom & Email</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Login</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rôle</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Performance</th>
                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary">
                        {agent.name ? agent.name.substring(0, 2).toUpperCase() : '??'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{agent.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{(agent as any).email || 'pas d\'email'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[11px] font-black text-muted-foreground">@{(agent as any).username || 'inconnu'}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      agent.role === 'admin' ? 'bg-purple-500/10 text-purple-500' : 
                      agent.role === 'qualite' ? 'bg-emerald-500/10 text-emerald-500' : 
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {agent.role === 'admin' ? '👑 Admin' : agent.role === 'qualite' ? '🛡️ Qualité' : '🎧 Agent'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                     <div className="flex flex-col items-center gap-1">
                        <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
                           <div className="h-full bg-primary" style={{ width: `${agent.score || 70}%` }}></div>
                        </div>
                        <span className="text-[10px] font-black text-primary">{agent.score || 70}%</span>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                         onClick={() => handleEdit(agent)}
                         className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                       >
                         <Zap className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => handleDelete(agent.id)}
                         className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                       >
                         <TrendingDown className="w-4 h-4" />
                       </button>
                    </div>
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
                    className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Jean Dupont"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Login (Pseudo)</label>
                  <input 
                    className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="jdupont"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email professionnel</label>
                <input 
                  type="email"
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="jean.d@crm.fr"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mot de passe</label>
                <input 
                  type="password"
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder={editingAgent ? "•••••••• (vide pour garder)" : "8 caractères min."}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Rôle système</label>
                <select 
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-xs font-bold outline-none cursor-pointer"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
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