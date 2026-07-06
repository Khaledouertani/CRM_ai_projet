import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, Mic, Star,
  ChevronRight, Search,
  ShieldCheck, CheckCircle2, AlertCircle,
  Calendar, TrendingDown, Clock, BellRing,
  X, ChevronDown, ChevronUp, CalendarCheck,
  Eye, Activity, BarChart2, Filter
} from 'lucide-react';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import api from '../../services/api';
import { useChartTheme } from '../../hooks/useChartTheme';

function useRealtimeClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

type AlertType = 'critical' | 'warning' | 'info';
const alertStyle: Record<AlertType, string> = {
  critical: 'border-rose-500/30 bg-rose-500/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
  info: 'border-blue-500/30 bg-blue-500/5',
};
const alertDot: Record<AlertType, string> = {
  critical: 'bg-rose-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-400',
};
const alertIcon: Record<AlertType, string> = {
  critical: '🔴',
  warning: '🟡',
  info: '🔵',
};

type TeamColor = 'emerald' | 'amber' | 'slate';
const teamPillBg: Record<TeamColor, string> = {
  emerald: 'bg-emerald-500/10',
  amber: 'bg-amber-500/10',
  slate: 'bg-slate-500/10',
};
const teamPillBorder: Record<TeamColor, string> = {
  emerald: 'border-emerald-500/20',
  amber: 'border-amber-500/20',
  slate: 'border-slate-500/20',
};
const teamPillDot: Record<TeamColor, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  slate: 'bg-slate-500',
};
const teamPillText: Record<TeamColor, string> = {
  emerald: 'text-emerald-500',
  amber: 'text-amber-500',
  slate: 'text-slate-500',
};

type StatColor = 'blue' | 'amber' | 'emerald' | 'rose' | 'purple' | 'slate';
const statBorder: Record<StatColor, string> = {
  blue: 'border-blue-500/10',
  amber: 'border-amber-500/10',
  emerald: 'border-emerald-500/10',
  rose: 'border-rose-500/10',
  purple: 'border-purple-500/10',
  slate: 'border-slate-500/10',
};
const statText: Record<StatColor, string> = {
  blue: 'text-blue-400',
  amber: 'text-amber-400',
  emerald: 'text-emerald-400',
  rose: 'text-rose-400',
  purple: 'text-purple-400',
  slate: 'text-slate-400',
};

type TabId = 'overview' | 'alerts' | 'history' | 'agents' | 'rdv';

interface DashboardAlert {
  id: number;
  type: AlertType;
  agent: string;
  message: string;
  category: string;
  created_at: string;
  read: boolean;
}

interface HistoryRow {
  id: number;
  date: string;
  agent: string;
  type: string;
  score: number;
  decision?: string;
  evaluator?: string;
}

interface AgentDetail {
  user_id: number;
  name: string;
  avg_quality_score: number;
  total_calls: number;
  avg_call_score: number;
  rdv_this_month: number;
  conversion_rate: number;
  trend: string;
  recent_evaluations: HistoryRow[];
}

export default function QualityDashboard() {
  const chartTheme = useChartTheme();
  const navigate = useNavigate();
  const clock = useRealtimeClock();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [alertFilter, setAlertFilter] = useState<'all' | AlertType>('all');
  const [loading, setLoading] = useState(true);
  const [expandedAgent, setExpandedAgent] = useState<number | null>(null);
  const [historySort, setHistorySort] = useState<'date' | 'score'>('date');

  const [teamStatus, setTeamStatus] = useState<any>(null);
  const [agentsState, setAgentsState] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [agents, setAgents] = useState<AgentDetail[]>([]);
  const [rdvJour, setRdvJour] = useState<any>(null);

  const unreadAlerts = alerts.filter(a => !a.read).length;

  const markAllRead = () => setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  const dismissAlert = (id: number) => setAlerts(prev => prev.filter(a => a.id !== id));

  const filteredAlerts = alerts.filter(a => alertFilter === 'all' || a.type === alertFilter);
  const sortedHistory = [...history].sort((a, b) => historySort === 'score' ? b.score - a.score : 0);
  const filteredAgents = agents.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamRes, agentsRes, statsRes, alertsRes, histRes, rdvRes, compRes] = await Promise.all([
          api.getQualityTeamStatus(),
          api.getQualityAgentsState(),
          api.getQualityGlobalStats(),
          api.getQualityDashboardAlerts(),
          api.getQualityEvaluationHistory(50, 0),
          api.getQualityRdvJour(),
          api.getQualityComparison(),
        ]);
        setTeamStatus(teamRes);
        setAgentsState(agentsRes);
        setGlobalStats(statsRes);
        setAlerts(alertsRes.map((a: any) => ({ ...a, read: false })));
        setHistory(histRes.map((h: any) => ({ ...h, date: h.date ? new Date(h.date).toLocaleDateString('fr-FR') : '' })));
        setRdvJour(rdvRes);
        setComparison(compRes);

        if (statsRes?.weekly_trends) {
          // already in globalStats
        }

        const agentDetails = await Promise.all(
          (agentsRes || []).slice(0, 20).map(async (a: any) => {
            try {
              return await api.getQualityAgentDetail(a.user_id);
            } catch { return null; }
          })
        );
        setAgents(agentDetails.filter(Boolean));
      } catch (error) {
        console.error('Failed to fetch quality dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const TABS: { id: TabId; label: string; badge?: number }[] = [
    { id: 'overview', label: 'Vue Globale' },
    { id: 'alerts', label: 'Alertes', badge: unreadAlerts },
    { id: 'history', label: 'Historique' },
    { id: 'agents', label: 'Détails Agents' },
    { id: 'rdv', label: 'RDV / Jour' },
  ];

  const weeklyTrends = globalStats?.weekly_trends || [];
  const rdvByAgent = rdvJour?.by_agent || [];
  const totalRdvToday = rdvJour?.total_today || 0;
  const objectifTotal = rdvJour?.objectif || 1;
  const rdvTaux = rdvJour?.taux || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter text-gray-900 dark:text-white uppercase">
            Service <span className="text-blue-500">Qualité</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Dashboard • {clock.toLocaleTimeString('fr-FR')}
          </p>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Score Qualité', value: `${globalStats?.avg_quality_score || 0}%`, sub: `CONFORMITÉ ${globalStats?.compliance_rate || 0}%`, icon: ShieldCheck, from: 'from-indigo-500', to: 'to-indigo-700', shadow: 'shadow-indigo-500/20' },
          { label: 'Conformité IA', value: `${globalStats?.compliance_rate || 0}%`, sub: 'OBJECTIF ATTEINT', icon: Star, from: 'from-emerald-500', to: 'to-emerald-700', shadow: 'shadow-emerald-500/20' },
          { label: 'Appels Analysés', value: `${globalStats?.total_calls_analyzed || 0}`, sub: `${globalStats?.present_today || 0} AGENTS PRÉSENTS`, icon: Mic, from: 'from-amber-500', to: 'to-amber-700', shadow: 'shadow-amber-500/20' },
          { label: 'Alertes Actives', value: `${unreadAlerts}`, sub: `${alerts.filter(a => a.type === 'critical').length} CRITIQUES`, icon: AlertCircle, from: 'from-rose-500', to: 'to-rose-700', shadow: 'shadow-rose-500/20' },
        ].map((kpi, i) => (
          <div key={i} className={`bg-gradient-to-br ${kpi.from} ${kpi.to} rounded-3xl p-5 text-white shadow-xl ${kpi.shadow} border-b-4 border-black/10`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <kpi.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-[9px] font-black uppercase tracking-widest opacity-80 italic">{kpi.label}</h3>
            <p className="text-3xl font-black italic tracking-tighter mt-1">{kpi.value}</p>
            <p className="text-[8px] font-black uppercase mt-2 inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-[#1E293B] text-slate-400 border border-blue-500/10 hover:border-blue-500/40'
              }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: Overview
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-8">

          {/* Team Status */}
          <div className="bg-[#1E293B] border border-blue-500/10 rounded-[32px] p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase italic tracking-tighter text-white">État de <span className="text-blue-400">l'Équipe</span></h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Temps Réel • {teamStatus?.members?.length || 0} Agents pointés</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { count: teamStatus?.online_count || 0, label: 'EN LIGNE', color: 'emerald' as TeamColor, pulse: true },
                  { count: teamStatus?.break_count || 0, label: 'EN PAUSE', color: 'amber' as TeamColor, pulse: false },
                  { count: teamStatus?.offline_count || 0, label: 'HORS LIGNE', color: 'slate' as TeamColor, pulse: false },
                ].map((s, i) => (
                  <div key={i} className={`px-4 py-2 ${teamPillBg[s.color]} border ${teamPillBorder[s.color]} rounded-2xl flex items-center gap-2`}>
                    <div className={`w-2 h-2 ${teamPillDot[s.color]} rounded-full ${s.pulse ? 'animate-pulse' : ''}`} />
                    <p className={`text-[10px] font-black ${teamPillText[s.color]} uppercase tracking-widest`}>{s.count} {s.label}</p>
                  </div>
                ))}
                <button onClick={() => navigate('/qualite/pointage')} className="px-4 py-2 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all">
                  Voir détails
                </button>
              </div>
            </div>

            {teamStatus?.members?.length > 0 && (
              <div className="pt-6 border-t border-blue-500/10 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                {teamStatus.members.map((member: any) => {
                  const isOnBreak = member.status === 'break';
                  return (
                    <div key={member.user_id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${isOnBreak ? 'bg-amber-500/5 border-amber-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${isOnBreak ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {(member.name || 'A').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-white uppercase truncate">{member.name}</p>
                        <p className={`text-[8px] font-black uppercase tracking-widest ${isOnBreak ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {isOnBreak ? `☕ ${member.break_type || 'Pause'}` : '● En poste'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#1E293B] border border-blue-500/10 p-6 rounded-[32px]">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" /> Tendance Qualité / Semaine
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyTrends}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                    <XAxis dataKey="day" stroke={chartTheme.textColor} fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis stroke={chartTheme.textColor} fontSize={9} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTheme.tooltipStyle} />
                    <Area type="monotone" dataKey="avg_score" stroke="#00D4FF" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" name="Score" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#1E293B] border border-blue-500/10 p-6 rounded-[32px]">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-400" /> RDV par Jour / Semaine
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                    <XAxis dataKey="day" stroke={chartTheme.textColor} fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis stroke={chartTheme.textColor} fontSize={9} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTheme.tooltipStyle} />
                    <Bar dataKey="rdv_count" fill="#10b981" radius={[6, 6, 0, 0]} name="RDV" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Comparative Section */}
          {comparison && (
            <div className="bg-[#1E293B] border border-blue-500/10 p-6 rounded-[32px]">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-5 h-5 text-blue-400" />
                <h3 className="font-black text-[10px] uppercase tracking-widest text-white">Analyse Comparative Centre</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: 'Performance Journalière', period: comparison.day, label: 'vs Hier' },
                  { title: 'Performance Hebdomadaire', period: comparison.week, label: 'vs Sem. Dernière' },
                  { title: 'Performance Mensuelle', period: comparison.month, label: 'vs Mois Dernier' },
                ].map((item, index) => (
                  <div key={index} className="bg-[#0F172A]/50 border border-blue-500/10 p-5 rounded-2xl">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500">{item.title}</h4>
                      <span className="text-[8px] font-bold text-slate-600 italic">{item.label}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="flex items-center gap-1">
                          {item.period?.evolution >= 0 ? (
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-rose-400" />
                          )}
                          <span className={`text-sm font-black ${item.period?.evolution >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {item.period?.evolution > 0 ? "+" : ""}{item.period?.evolution ?? 0}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-blue-400">
                          {item.period?.current_avg_score ?? 0}% Qualité
                        </p>
                        <div className={`text-[8px] font-bold mt-1 ${(item.period?.score_evol ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {(item.period?.score_evol ?? 0) > 0 ? "+" : ""}{item.period?.score_evol ?? 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agents table */}
          <div className="bg-[#1E293B] border border-blue-500/10 rounded-[32px] overflow-hidden">
            <div className="p-6 border-b border-blue-500/10 flex items-center justify-between">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-white">Performances Agents</h3>
              <button onClick={() => setActiveTab('agents')} className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 flex items-center gap-1">
                Voir tout <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-blue-500/5 bg-blue-500/5">
                    {['Agent', 'Qualité IA', 'Conversion', 'Appels', 'Action'].map(h => (
                      <th key={h} className="px-6 py-4 text-[8px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-500/5">
                  {loading ? (
                    <tr><td colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-7 h-7 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Chargement...</p>
                      </div>
                    </td></tr>
                  ) : (
                    agents.slice(0, 5).map((agent) => (
                      <tr key={agent.user_id} className="hover:bg-blue-500/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-[10px]">
                              {agent.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-white uppercase">{agent.name}</p>
                              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Agent Certifié</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`text-sm font-black ${agent.avg_quality_score > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {Math.round(agent.avg_quality_score)}%
                            </span>
                            <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                              <div className={`h-full ${agent.avg_quality_score > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${agent.avg_quality_score}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className="text-xs font-bold text-white">{Math.round(agent.conversion_rate)}%</span></td>
                        <td className="px-6 py-4"><span className="text-xs font-bold text-slate-400">{agent.total_calls}</span></td>
                        <td className="px-6 py-4">
                          <button onClick={() => navigate('/qualite/agents')} className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-[9px] font-black uppercase hover:bg-amber-500/20 transition-all flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> Évaluer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: Alerts
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div className="bg-[#1E293B] border border-blue-500/10 rounded-[32px] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-600/20">
                <BellRing className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase italic text-white">Alertes <span className="text-rose-400">Superviseur</span></h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{unreadAlerts} non lues • Temps réel</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {(['all', 'critical', 'warning', 'info'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setAlertFilter(f)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${alertFilter === f
                      ? f === 'all' ? 'bg-blue-600 text-white'
                        : f === 'critical' ? 'bg-rose-600 text-white'
                          : f === 'warning' ? 'bg-amber-600 text-white'
                            : 'bg-blue-600 text-white'
                      : 'bg-[#0F172A] text-slate-400 border border-blue-500/10'
                    }`}
                >
                  {f === 'all' ? 'Toutes' : f === 'critical' ? '🔴 Critiques' : f === 'warning' ? '🟡 Attention' : '🔵 Info'}
                </button>
              ))}
              <button onClick={markAllRead} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-600 transition-all flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Tout marquer lu
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="bg-[#1E293B] border border-blue-500/10 p-12 rounded-[32px] text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aucune alerte • Tout est normal</p>
              </div>
            ) : (
              filteredAlerts.map(alert => (
                <div key={alert.id} className={`relative flex items-start gap-4 p-5 rounded-2xl border transition-all ${alertStyle[alert.type]} ${!alert.read ? 'ring-1 ring-inset ring-blue-500/20' : 'opacity-70'}`}>
                  {!alert.read && <div className={`absolute top-4 right-14 w-2 h-2 rounded-full ${alertDot[alert.type]} animate-pulse`} />}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${alert.type === 'critical' ? 'bg-rose-500/20' : alert.type === 'warning' ? 'bg-amber-500/20' : 'bg-blue-500/20'
                    }`}>
                    {alertIcon[alert.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${alert.type === 'critical' ? 'bg-rose-500/20 text-rose-400' : alert.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>{alert.type}</span>
                      <span className="text-[8px] font-black text-slate-500 uppercase">{alert.category}</span>
                    </div>
                    <p className="text-xs font-black text-white uppercase">{alert.agent}</p>
                    <p className="text-[10px] font-medium text-slate-300 mt-0.5">{alert.message}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[8px] font-bold text-slate-500">{alert.created_at ? new Date(alert.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    <button onClick={() => dismissAlert(alert.id)} className="w-7 h-7 flex items-center justify-center bg-slate-700/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Critiques', count: alerts.filter(a => a.type === 'critical').length, color: 'rose' as StatColor },
              { label: 'Attention', count: alerts.filter(a => a.type === 'warning').length, color: 'amber' as StatColor },
              { label: 'Information', count: alerts.filter(a => a.type === 'info').length, color: 'blue' as StatColor },
            ].map((s, i) => (
              <div key={i} className={`bg-[#1E293B] border ${statBorder[s.color]} p-5 rounded-2xl`}>
                <p className={`text-[8px] font-black uppercase tracking-widest ${statText[s.color]}`}>{s.label}</p>
                <p className={`text-3xl font-black ${statText[s.color]} mt-1`}>{s.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: History
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-[#1E293B] border border-blue-500/10 rounded-[32px] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <BarChart2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase italic text-white">Historique des <span className="text-indigo-400">Évaluations</span></h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{history.length} évaluations enregistrées</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setHistorySort(historySort === 'date' ? 'score' : 'date')}
                className="px-4 py-2 bg-[#0F172A] border border-blue-500/20 rounded-xl text-[9px] font-black text-blue-400 uppercase tracking-widest hover:border-blue-500/50 transition-all flex items-center gap-1"
              >
                <Filter className="w-3 h-3" /> Tri : {historySort === 'date' ? 'Date' : 'Score'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Évaluations totales', value: history.length, icon: '📋', color: 'blue' as StatColor },
              { label: 'Score moyen', value: `${history.length > 0 ? Math.round(history.reduce((s, h) => s + h.score, 0) / history.length) : 0}%`, icon: '⭐', color: 'amber' as StatColor },
              { label: 'Meilleures notes', value: history.filter(h => h.score >= 90).length, icon: '🏆', color: 'emerald' as StatColor },
              { label: 'Alertes générées', value: history.filter(h => h.score < 70).length, icon: '⚠️', color: 'rose' as StatColor },
            ].map((s, i) => (
              <div key={i} className={`bg-[#1E293B] border ${statBorder[s.color]} p-5 rounded-2xl`}>
                <p className="text-lg mb-1">{s.icon}</p>
                <p className={`text-2xl font-black ${statText[s.color]}`}>{s.value}</p>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#1E293B] border border-blue-500/10 rounded-[32px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-blue-500/5 bg-blue-500/5">
                    {['Date', 'Agent', 'Type', 'Score', 'Décision', 'Évaluateur', 'Action'].map(h => (
                      <th key={h} className="px-5 py-4 text-[8px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-500/5">
                  {sortedHistory.map((row) => (
                    <tr key={row.id} className="hover:bg-blue-500/5 transition-colors">
                      <td className="px-5 py-4 text-[10px] font-bold text-slate-400">{row.date}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-[8px] font-black text-white">
                            {row.agent.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <span className="text-[10px] font-black text-white uppercase">{row.agent}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${row.type === 'Évaluation IA' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black ${row.score >= 90 ? 'text-emerald-400' : row.score >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {Math.round(row.score)}%
                          </span>
                          <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full ${row.score >= 90 ? 'bg-emerald-500' : row.score >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${row.score}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-bold text-slate-300 uppercase">{row.decision || '—'}</span>
                      </td>
                      <td className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase">{row.evaluator}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => navigate('/qualite/agents')} className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: Agents Details
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'agents' && (
        <div className="space-y-6">
          <div className="bg-[#1E293B] border border-blue-500/10 rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase italic text-white">Détails <span className="text-purple-400">Agents</span></h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{agents.length} agents • Cliquer pour développer</p>
              </div>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="RECHERCHER AGENT..."
                className="w-full bg-[#0F172A] border border-blue-500/10 rounded-xl pl-9 pr-4 py-2.5 text-[10px] font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all uppercase tracking-widest"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredAgents.map((agent) => {
              const isExpanded = expandedAgent === agent.user_id;
              const qualityScore = Math.round(agent.avg_quality_score);
              const scoreColor = qualityScore >= 80 ? '#10b981' : qualityScore >= 70 ? '#f59e0b' : '#ef4444';
              return (
                <div key={agent.user_id} className="bg-[#1E293B] border border-blue-500/10 rounded-[28px] overflow-hidden transition-all">
                  <button
                    className="w-full flex items-center gap-4 p-6 hover:bg-blue-500/5 transition-all"
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.user_id)}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-lg" style={{ backgroundColor: scoreColor + '33', border: `2px solid ${scoreColor}40` }}>
                      <span style={{ color: scoreColor }}>{agent.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-black text-white uppercase">{agent.name}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Agent Commercial</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className={`text-lg font-black ${qualityScore >= 80 ? 'text-emerald-400' : qualityScore >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>{qualityScore}%</p>
                        <p className="text-[8px] font-black text-slate-500 uppercase">Qualité</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-black text-blue-400">{agent.rdv_this_month}</p>
                        <p className="text-[8px] font-black text-slate-500 uppercase">RDV</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-black text-slate-300">{agent.total_calls}</p>
                        <p className="text-[8px] font-black text-slate-500 uppercase">Appels</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {agent.trend === 'up' ? (
                          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[8px] font-black">
                            <TrendingUp className="w-3 h-3" /> EN HAUSSE
                          </div>
                        ) : agent.trend === 'down' ? (
                          <div className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 text-rose-400 rounded-lg text-[8px] font-black">
                            <TrendingDown className="w-3 h-3" /> EN BAISSE
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-1 bg-slate-500/10 text-slate-400 rounded-lg text-[8px] font-black">
                            STABLE
                          </div>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-blue-500/10 p-6 bg-[#0F172A]/30 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                          { label: 'Score Qualité', value: `${qualityScore}%`, color: (qualityScore >= 80 ? 'emerald' : qualityScore >= 70 ? 'amber' : 'rose') as StatColor },
                          { label: 'Taux Conversion', value: `${Math.round(agent.conversion_rate)}%`, color: 'blue' as StatColor },
                          { label: 'RDV ce mois', value: agent.rdv_this_month, color: 'purple' as StatColor },
                          { label: 'Total Appels', value: agent.total_calls, color: 'slate' as StatColor },
                        ].map((m, i) => (
                          <div key={i} className="bg-[#1E293B] rounded-2xl p-4 text-center">
                            <p className={`text-2xl font-black ${statText[m.color]}`}>{m.value}</p>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">{m.label}</p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        {[
                          { label: 'Score Moyen Appels', value: Math.round(agent.avg_call_score) },
                          { label: 'Taux Conversion', value: Math.round(agent.conversion_rate) },
                          { label: 'RDV / Objectif (15)', value: Math.round((agent.rdv_this_month / 15) * 100) },
                          { label: 'Qualité Globale', value: qualityScore },
                        ].map((bar, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-slate-400 uppercase w-44 shrink-0">{bar.label}</span>
                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${bar.value >= 80 ? 'bg-emerald-500' : bar.value >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${Math.min(100, bar.value)}%` }}
                              />
                            </div>
                            <span className={`text-[10px] font-black w-10 text-right ${bar.value >= 80 ? 'text-emerald-400' : bar.value >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>{bar.value}%</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3 mt-5">
                        <button onClick={() => navigate('/qualite/agents')} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-500 transition-all">
                          Évaluer cet agent
                        </button>
                        <button onClick={() => navigate('/qualite/trends')} className="px-4 py-2.5 bg-[#1E293B] border border-blue-500/20 text-blue-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-blue-500 transition-all">
                          Tendances
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: RDV / Jour
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'rdv' && (
        <div className="space-y-6">
          <div className="bg-[#1E293B] border border-blue-500/10 rounded-[32px] p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  <CalendarCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase italic text-white">RDV <span className="text-emerald-400">Par Jour</span></h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Suivi Objectifs Journaliers • {new Date().toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <p className="text-2xl font-black text-emerald-400">{totalRdvToday}</p>
                  <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">RDV Aujourd'hui</p>
                </div>
                <div className="text-center px-5 py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                  <p className="text-2xl font-black text-blue-400">{rdvTaux}%</p>
                  <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Objectif Global</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progression équipe ({totalRdvToday}/{objectifTotal})</span>
                <span className="text-[10px] font-black text-emerald-400">{rdvTaux}%</span>
              </div>
              <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, rdvTaux)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#1E293B] border border-blue-500/10 p-6 rounded-[32px]">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-white mb-6 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" /> RDV par Agent vs Objectif
            </h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rdvByAgent} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                  <XAxis dataKey="name" stroke={chartTheme.textColor} fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis stroke={chartTheme.textColor} fontSize={9} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  <Bar dataKey="rdv_count" fill="#10b981" radius={[6, 6, 0, 0]} name="RDV réalisés" />
                  <Bar dataKey="objectif" fill="#334155" radius={[6, 6, 0, 0]} name="Objectif" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rdvByAgent.map((agent: any) => {
              const exceeded = agent.rdv_count >= agent.objectif;
              const pct = Math.min(100, Math.round(agent.taux));
              return (
                <div key={agent.agent_id} className={`bg-[#1E293B] border rounded-2xl p-5 transition-all ${exceeded ? 'border-emerald-500/30' : 'border-blue-500/10'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white ${exceeded ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                        {agent.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase">{agent.name}</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Agent Commercial</p>
                      </div>
                    </div>
                    {exceeded && (
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[8px] font-black uppercase">
                        ✅ Objectif
                      </span>
                    )}
                  </div>

                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <span className={`text-3xl font-black ${exceeded ? 'text-emerald-400' : 'text-white'}`}>{agent.rdv_count}</span>
                      <span className="text-slate-500 text-sm font-black ml-1">/{agent.objectif}</span>
                    </div>
                    <span className={`text-[10px] font-black ${pct >= 100 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>{pct}%</span>
                  </div>

                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">RDV / Objectif</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${pct >= 100 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {pct >= 100 ? 'Atteint ✓' : pct >= 60 ? 'En cours' : 'En retard ⚠'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-[#1E293B] border border-blue-500/10 p-6 rounded-[32px]">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" /> Évolution RDV — Cette Semaine
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrends}>
                  <defs>
                    <linearGradient id="rdvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                  <XAxis dataKey="day" stroke={chartTheme.textColor} fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis stroke={chartTheme.textColor} fontSize={9} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  <Area type="monotone" dataKey="rdv_count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#rdvGrad)" name="RDV" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
