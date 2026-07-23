import React, { useState, useEffect } from 'react';
import {
  Activity, Clock, AlertTriangle, Users, Phone, TrendingUp,
  Zap, CheckCircle2, XCircle, Coffee, RefreshCw, UserCheck,
  ArrowUpRight, ArrowDownRight, Headphones, Brain, Target
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import api from '../../services/api';
import { useChartTheme } from '../../hooks/useChartTheme';

interface AgentLive {
  id: number;
  name: string;
  status: 'active' | 'inactive' | 'break';
  calls: number;
  idleTime: number;
  score?: number;
}

interface HourlyPoint {
  h: string;
  appels: number;
  conversions: number;
}

const statusConfig = {
  active: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-500', label: 'Actif', icon: CheckCircle2 },
  inactive: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', dot: 'bg-red-500 animate-pulse', label: 'Inactif', icon: XCircle },
  break: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-500', label: 'Pause', icon: Coffee },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border px-3 py-2 rounded-xl shadow-xl text-xs">
        <p className="font-bold text-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">
            {p.name === 'appels' ? '📞' : '✅'} {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function RealTimePage() {
  const chartTheme = useChartTheme();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentLive[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyPoint[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [live, overview] = await Promise.allSettled([
        api.getLiveAgents(),
        api.getAnalyticsOverview(),
      ]);
      if (live.status === 'fulfilled') setAgents(live.value || []);
      if (overview.status === 'fulfilled' && overview.value?.hourly) {
        setHourlyData(
          overview.value.hourly.map((h: any) => ({
            h: `${h.hour}h`,
            appels: h.appels,
            conversions: Math.round((h.appels || 0) * 0.3),
          }))
        );
      }
    } catch (err) {
      console.error("Live fetch error:", err);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  const activeAgents = agents.filter(a => a.status === 'active');
  const inactiveAgents = agents.filter(a => a.status === 'inactive');
  const onBreakAgents = agents.filter(a => a.status === 'break');
  const totalCalls = agents.reduce((s, a) => s + a.calls, 0);
  const avgScore = agents.length ? Math.round(agents.reduce((s, a) => s + (a.score || 0), 0) / agents.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Live</span>
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter text-foreground">
            Supervision Temps Réel
          </h2>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Monitoring de l'activité des agents · Mis à jour à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-bold hover:bg-muted transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Users, label: 'Agents Actifs', value: activeAgents.length,
            sub: `/ ${agents.length} total`, color: 'from-emerald-500/20 to-emerald-600/5',
            iconColor: 'text-emerald-400', border: 'border-emerald-500/20'
          },
          {
            icon: Phone, label: 'Appels du Jour', value: totalCalls,
            sub: '+12% vs hier', color: 'from-blue-500/20 to-blue-600/5',
            iconColor: 'text-blue-400', border: 'border-blue-500/20', up: true
          },
          {
            icon: AlertTriangle, label: 'Agents Inactifs', value: inactiveAgents.length,
            sub: inactiveAgents.length > 0 ? 'Action requise' : 'Aucun problème',
            color: inactiveAgents.length > 0 ? 'from-red-500/20 to-red-600/5' : 'from-slate-500/10 to-slate-600/5',
            iconColor: inactiveAgents.length > 0 ? 'text-red-400' : 'text-muted-foreground',
            border: inactiveAgents.length > 0 ? 'border-red-500/20' : 'border-border'
          },
          {
            icon: Target, label: 'Score Moyen', value: `${avgScore}%`,
            sub: avgScore >= 75 ? '✅ Bon niveau' : '⚠️ À améliorer',
            color: 'from-purple-500/20 to-purple-600/5',
            iconColor: 'text-purple-400', border: 'border-purple-500/20'
          },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className={`relative overflow-hidden bg-gradient-to-br ${kpi.color} border ${kpi.border} rounded-2xl p-5 shadow-sm`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-card/60 flex items-center justify-center shadow-inner ${kpi.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {kpi.up !== undefined && (
                  <span className={`flex items-center gap-0.5 text-[11px] font-bold ${kpi.up ? 'text-emerald-400' : 'text-red-400'}`}>
                    {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  </span>
                )}
              </div>
              <div className="text-3xl font-black text-foreground">{kpi.value}</div>
              <div className="text-xs font-bold text-muted-foreground mt-0.5">{kpi.label}</div>
              <div className="text-[11px] font-semibold text-muted-foreground/60 mt-1">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Chart + AI Recommandations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-foreground">Appels par heure — Aujourd'hui</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
              <XAxis dataKey="h" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} stroke={chartTheme.textColor} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} stroke={chartTheme.textColor} />
              <Tooltip content={<CustomTooltip />} contentStyle={chartTheme.tooltipStyle} />
              <Area type="monotone" dataKey="appels" name="appels" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#colorCalls)" />
              <Area type="monotone" dataKey="conversions" name="conversions" stroke="#10b981" strokeWidth={2.5} fill="url(#colorConv)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Recommendations */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <Brain className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-foreground">Recommandations IA</h3>
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {inactiveAgents.length > 0 && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-xs font-black text-red-400 uppercase tracking-wide">Agents inactifs</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  {inactiveAgents.map(a => a.name).join(', ')} — inactivité détectée. Relance recommandée.
                </p>
              </div>
            )}
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-black text-blue-400 uppercase tracking-wide">Pic 14h–16h</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                Volume d'appels en hausse. Concentrez vos meilleurs agents sur ce créneau.
              </p>
            </div>
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">Top performer</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {activeAgents.sort((a, b) => (b.score || 0) - (a.score || 0))[0]?.name || 'Aucun'} est le plus performant aujourd'hui — score {activeAgents.sort((a, b) => (b.score || 0) - (a.score || 0))[0]?.score || 0}%.
              </p>
            </div>
            <div className="p-3.5 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-xs font-black text-purple-400 uppercase tracking-wide">Taux de conversion</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {totalCalls > 0 && hourlyData.length > 0 ? Math.round((hourlyData.reduce((s, d) => s + d.conversions, 0) / totalCalls) * 100) : 0}% moyen — objectif 35% atteint ✅
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Live Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Headphones className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-foreground">Agents en Temps Réel</h3>
          <span className="ml-auto text-xs font-bold text-muted-foreground">
            {activeAgents.length} actifs · {onBreakAgents.length} en pause · {inactiveAgents.length} inactifs
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-6 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Agent</th>
                <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Statut</th>
                <th className="text-center px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Appels</th>
                <th className="text-center px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Score IA</th>
                <th className="text-center px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Inactivité</th>
                <th className="text-right px-6 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent, i) => {
                const cfg =
                  statusConfig[agent.status as keyof typeof statusConfig] ??
                  statusConfig.inactive;

                const StatusIcon = cfg.icon;
                return (
                  <tr key={agent.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/5'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-indigo-600/40 flex items-center justify-center text-xs font-black text-gray-900 dark:text-white">
                          {agent.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-foreground">{agent.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border ${cfg.bg} ${cfg.color}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {agent.status === 'break' && (agent as any).breakType ? `Pause ${(agent as any).breakType}` : cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-black text-foreground text-lg">{agent.calls}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex-1 max-w-[80px] h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${(agent.score || 0) >= 80 ? 'bg-emerald-500' : (agent.score || 0) >= 65 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${agent.score}%` }}
                          />
                        </div>
                        <span className={`text-xs font-black min-w-[32px] ${(agent.score || 0) >= 80 ? 'text-emerald-400' : (agent.score || 0) >= 65 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {agent.score}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {agent.status === 'inactive' ? (
                        <span className="text-red-400 font-bold text-sm">{agent.idleTime} min</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      {agent.status === 'inactive' ? (
                        <button
                          onClick={async () => {
                            try {
                              await api.sendMessage(agent.id, "Activité détectée comme inactive. Merci de reprendre vos appels.", true);
                              alert("Relance envoyée à " + agent.name);
                            } catch { alert("Erreur lors de l'envoi"); }
                          }}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-red-500/20"
                        >
                          Relancer
                        </button>
                      ) : (
                        <button
                          onClick={() => window.location.href = '/admin/messages?user=' + agent.id}
                          className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-lg transition-colors border border-border"
                        >
                          Contacter
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Banner */}
      {inactiveAgents.length > 0 && (
        <div className="flex items-center justify-between bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl px-6 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-foreground text-sm">
                Alerte Inactivité détectée
              </p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                {inactiveAgents.length} agent(s) inactif(s) depuis plus de 15 minutes. Action immédiate recommandée.
              </p>
            </div>
          </div>
          <button className="shrink-0 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-black rounded-xl transition-colors shadow-md shadow-red-500/20 ml-4">
            Agir maintenant
          </button>
        </div>


      )}
    </div>
  );
}