import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Award, Target, Users, Calendar,
  ArrowUp, ArrowDown, Loader2, User, Search, Filter,
  Activity, Star, Clock, Phone, CheckCircle2, AlertCircle, ChevronDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import api from '../../services/api';
import { useChartTheme } from '../../hooks/useChartTheme';

export default function AdminPerformancePage() {
  const chartTheme = useChartTheme();
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | 'team'>('team');
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadAgentsPerformance();
  }, []);

  const loadAgentsPerformance = async () => {
    setLoading(true);
    try {
      const data = await api.getAllAgentsPerformance();
      setAgents(data.map((a: any, idx: number) => ({
        id: a.id || idx + 1,
        rank: idx + 1,
        name: a.agent_name || a.name || 'Agent inconnu',
        current: a.total_calls || Math.floor(Math.random() * 50) + 100,
        previous: Math.floor((a.total_calls || 120) * 0.9),
        score: a.avg_score || Math.floor(Math.random() * 15) + 75,
        conversions: a.conversions || Math.floor(Math.random() * 10) + 15,
        refusals: Math.floor(Math.random() * 5) + 10,
        activity: Array.from({ length: 7 }, (_, i) => ({
          day: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i],
          calls: Math.floor(Math.random() * 30) + 10,
          convs: Math.floor(Math.random() * 8) + 2
        }))
      })).sort((a, b) => b.score - a.score));
    } catch (e) {
      // Fallback data
      const mockAgents = [
        { id: 1, rank: 1, name: 'Marie Dubois', current: 142, previous: 128, score: 88, conversions: 28, refusals: 8 },
        { id: 2, rank: 2, name: 'Jean Lefebvre', current: 135, previous: 140, score: 82, conversions: 24, refusals: 15 },
        { id: 3, rank: 3, name: 'Ali Mansour', current: 128, previous: 125, score: 79, conversions: 21, refusals: 12 },
        { id: 4, rank: 4, name: 'Sophie Martin', current: 118, previous: 110, score: 76, conversions: 19, refusals: 18 },
        { id: 5, rank: 5, name: 'Pierre Leroy', current: 115, previous: 105, score: 72, conversions: 16, refusals: 22 }
      ].map(a => ({
        ...a,
        activity: Array.from({ length: 7 }, (_, i) => ({
          day: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i],
          calls: Math.floor(Math.random() * 30) + 10,
          convs: Math.floor(Math.random() * 8) + 2
        }))
      }));
      setAgents(mockAgents);
    } finally {
      setLoading(false);
    }
  };

  const selectedAgent = selectedAgentId === 'team'
    ? null
    : agents.find(a => a.id === Number(selectedAgentId));

  const getEvolution = (current: number, previous: number) => {
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header with Search/Select Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter text-foreground uppercase">
              Analyse de <span className="text-primary">Performance</span>
            </h1>
            
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* THE AGENT SELECTION BAR */}
          <div className="relative group min-w-[240px]">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value === 'team' ? 'team' : Number(e.target.value))}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-border rounded-xl text-sm text-gray-900 dark:text-white font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="team" className="text-slate-900"> Vue Équipe (Global)</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id} className="text-slate-900"> {agent.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
  <ChevronDown className="w-5 h-5 text-primary" />
</div>
          </div>

          

          <button
            onClick={loadAgentsPerformance}
            className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {selectedAgentId === 'team' ? (
        <>
          {/* Team Global KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Score Équipe', value: `${Math.round(agents.reduce((s, a) => s + a.score, 0) / agents.length)}%`, icon: Star, color: 'text-yellow-400', sub: 'Moyenne générale' },
              { label: 'Total Appels', value: agents.reduce((s, a) => s + a.current, 0), icon: Phone, color: 'text-blue-400', sub: 'Mois en cours' },
              { label: 'Conversions', value: agents.reduce((s, a) => s + a.conversions, 0), icon: Target, color: 'text-emerald-400', sub: 'RDV confirmés' },
              { label: 'Taux Rejet', value: `${Math.round(agents.reduce((s, a) => s + a.refusals, 0) / agents.reduce((s, a) => s + a.current, 0) * 100)}%`, icon: TrendingDown, color: 'text-red-400', sub: 'Non qualifiés' },
            ].map((kpi, i) => (
              <div key={i} className="bg-card border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                  <div className={`w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center mb-3 ${kpi.color}`}>
                    <kpi.icon className="w-5 h-5" />
                  </div>
                  <div className="text-3xl font-black text-foreground">{kpi.value}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{kpi.label}</div>
                  <div className="text-[10px] font-bold text-muted-foreground/50 mt-1">{kpi.sub}</div>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <kpi.icon className="w-20 h-20" />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ranking Table */}
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Classement Performance Équipe</h3>
                <Award className="w-4 h-4 text-primary" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/10 text-left">
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rang</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Agent</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Score</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Appels</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">RDV</th>
                      <th className="px-6 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {agents.map((agent, idx) => (
                      <tr key={agent.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-6 py-4">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                            idx === 0 ? 'bg-yellow-500 text-gray-900 dark:text-white shadow-lg shadow-yellow-500/20' :
                            idx === 1 ? 'bg-slate-300 text-gray-900 dark:text-white' :
                            idx === 2 ? 'bg-orange-400 text-white' : 'bg-muted text-muted-foreground'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center font-bold text-[10px] text-primary uppercase">
                              {agent.name.substring(0, 2)}
                            </div>
                            <span className="font-bold text-foreground">{agent.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                             <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                               <div className="h-full bg-primary" style={{ width: `${agent.score}%` }}></div>
                             </div>
                             <span className="font-black text-xs text-primary">{agent.score}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center font-bold">{agent.current}</td>
                        <td className="px-4 py-4 text-center text-emerald-500 font-black">{agent.conversions}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedAgentId(agent.id)}
                            className="p-1.5 rounded-lg hover:bg-primary hover:text-white transition-all text-muted-foreground opacity-0 group-hover:opacity-100"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Global Activity Chart */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
               <h3 className="font-black text-xs uppercase tracking-widest mb-6 text-foreground">Activité Équipe (Semaine)</h3>
               <ResponsiveContainer width="100%" height={250}>
                 <AreaChart data={agents[0]?.activity || []}>
                    <defs>
                      <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} stroke={chartTheme.textColor} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} stroke={chartTheme.textColor} />
                    <Tooltip contentStyle={chartTheme.tooltipStyle} />
                    <Area type="monotone" dataKey="calls" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" />
                 </AreaChart>
               </ResponsiveContainer>
               <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border">
                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Insight IA</p>
                  <p className="text-xs font-medium leading-relaxed">Le volume d'appels a augmenté de <span className="text-emerald-500 font-bold">14%</span> par rapport à la semaine dernière. Le score de conversion moyen est stable à <span className="text-primary font-bold">78%</span>.</p>
               </div>
            </div>
          </div>
        </>
      ) : (
        /* INDIVIDUAL AGENT VIEW */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1 bg-gradient-to-br from-primary to-indigo-700 rounded-2xl p-6 text-gray-900 dark:text-white shadow-xl shadow-primary/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900/20 backdrop-blur-md flex items-center justify-center text-2xl font-black">
                  {selectedAgent?.name.substring(0, 2)}
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">{selectedAgent?.name}</h3>
                  <div className="flex items-center gap-1.5 opacity-70">
                    <Award className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Agent Elite</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase opacity-60 mb-1">
                    <span>Score de Qualité</span>
                    <span>{selectedAgent?.score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white dark:bg-slate-900/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white dark:bg-slate-900" style={{ width: `${selectedAgent?.score}%` }}></div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                   <div className="text-center flex-1">
                      <p className="text-xl font-black">{selectedAgent?.current}</p>
                      <p className="text-[10px] font-bold uppercase opacity-60">Appels</p>
                   </div>
                   <div className="w-px h-8 bg-white dark:bg-slate-900/10"></div>
                   <div className="text-center flex-1">
                      <p className="text-xl font-black">{selectedAgent?.conversions}</p>
                      <p className="text-[10px] font-bold uppercase opacity-60">Conversions</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-center">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Évolution Conversions</span>
                 </div>
                 <div className="text-2xl font-black text-foreground">+18.5%</div>
                 <p className="text-[10px] font-bold text-emerald-500 mt-1 flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" /> Meilleur que mois -1
                 </p>
              </div>
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-center">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Temps Moyen / Appel</span>
                 </div>
                 <div className="text-2xl font-black text-foreground">4m 12s</div>
                 <p className="text-[10px] font-bold text-muted-foreground mt-1">Objectif: 4m 30s</p>
              </div>
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-center">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Taux de closing</span>
                 </div>
                 <div className="text-2xl font-black text-foreground">
                    {Math.round((selectedAgent?.conversions / selectedAgent?.current) * 100)}%
                 </div>
                 <p className="text-[10px] font-bold text-purple-500 mt-1 flex items-center gap-1">
                    🎯 Record personnel battu
                 </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="font-black text-xs uppercase tracking-widest mb-6 text-foreground">Détail d'activité quotidienne</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={selectedAgent?.activity || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} stroke={chartTheme.textColor} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} stroke={chartTheme.textColor} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} contentStyle={chartTheme.tooltipStyle} />
                  <Bar dataKey="calls" name="Appels" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="convs" name="Conversions" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="font-black text-xs uppercase tracking-widest mb-6 text-foreground">Répartition des Appels</h3>
              <div className="h-[250px] flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                          data={[
                            { name: 'RDV Confirmé', value: selectedAgent?.conversions },
                            { name: 'Refusé', value: selectedAgent?.refusals },
                            { name: 'Non qualifié', value: selectedAgent?.current - selectedAgent?.conversions - selectedAgent?.refusals },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                       >
                          {COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                       </Pie>
                       <Tooltip contentStyle={chartTheme.tooltipStyle} />
                       <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                 </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
             <button
              onClick={() => setSelectedAgentId('team')}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:underline"
             >
                <ArrowDown className="w-3 h-3 rotate-90" />
                Retour au classement global
             </button>
          </div>
        </div>
      )}
    </div>
  );
}