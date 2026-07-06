import React from 'react';
import { Phone, CheckCircle, Clock, TrendingUp, Save } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useChartTheme } from '../../hooks/useChartTheme';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BREAK_OPTIONS = [
  { id: 'cafe', label: 'Pause Café', color: 'amber' },
  { id: 'dejeuner', label: 'Pause Déj (1h)', color: 'amber' },
  { id: 'reunion', label: 'Réunion', color: 'blue' },
  { id: 'personnelle', label: 'Permission', color: 'rose' },
] as const;

const BREAK_LABELS: Record<string, string> = {
  cafe: 'Café',
  dejeuner: 'Déjeuner',
  priere: 'Prière',
  technique: 'Technique',
  personnelle: 'Personnelle',
  reunion: 'Réunion',
  formation: 'Formation',
  Permission: 'Permission',
};

const PAUSE_BG: Record<string, string> = {
  amber: 'bg-amber-500/10',
  orange: 'bg-orange-500/10',
  emerald: 'bg-emerald-500/10',
  blue: 'bg-blue-500/10',
  purple: 'bg-purple-500/10',
  indigo: 'bg-indigo-500/10',
  teal: 'bg-teal-500/10',
  rose: 'bg-rose-500/10',
};

const PAUSE_TEXT: Record<string, string> = {
  amber: 'text-amber-600',
  orange: 'text-orange-600',
  emerald: 'text-emerald-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  indigo: 'text-indigo-600',
  teal: 'text-teal-600',
  rose: 'text-rose-600',
};

const PAUSE_HOVER_BG: Record<string, string> = {
  amber: 'hover:bg-amber-500',
  orange: 'hover:bg-orange-500',
  emerald: 'hover:bg-emerald-500',
  blue: 'hover:bg-blue-500',
  purple: 'hover:bg-purple-500',
  indigo: 'hover:bg-indigo-500',
  teal: 'hover:bg-teal-500',
  rose: 'hover:bg-rose-500',
};

const formatElapsed = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

function AttendanceManager() {
  const [status, setStatus] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [pauseSeconds, setPauseSeconds] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPauseSeconds(0);
  };

  const startTimer = (startMs: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
    setPauseSeconds(elapsed);
    timerRef.current = setInterval(() => {
      setPauseSeconds(prev => prev + 1);
    }, 1000);
  };

  const applyServerStatus = (data: any) => {
  if (!data) return;

  // Convert active -> online
  if (data.status === "active") {
    data.status = "online";
  }

  setStatus(data);

  if (data.status === "break" && data.start_time) {
    startTimer(new Date(data.start_time).getTime());
  } else {
    stopTimer();
  }
};

  const fetchStatus = async () => {
    try {
      const data = await api.getAttendanceStatus();
      applyServerStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStatus();
    pollingRef.current = setInterval(fetchStatus, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleClockIn = async () => {
    try {
      await api.clockIn();
      toast.success('Pointage Entrée réussi !');
      fetchStatus();
    } catch (e) {
      toast.error('Erreur de pointage');
    }
  };

  const handleClockOut = async () => {
    try {
      await api.clockOut();
      toast.success('Pointage Sortie réussi !');
      fetchStatus();
    } catch (e) {
      toast.error('Erreur de pointage');
    }
  };

  const handleStartBreak = async (type: string) => {
    const prevStatus = status;
    setStatus({ ...status, status: 'break', break_type: type });
    startTimer(Date.now());
    try {
      const res = await api.startBreak(type);
      if (res?.success === false) {
        setStatus(prevStatus);
        stopTimer();
        toast.error(res?.message || 'Erreur pause');
        return;
      }
      toast.success(`Pause ${BREAK_LABELS[type] || type} démarrée`);
      fetchStatus();
    } catch (e) {
      setStatus(prevStatus);
      stopTimer();
      toast.error('Erreur pause');
    }
  };

  const handleEndBreak = async () => {
    try {
      await api.endBreak();
    } catch (e) {
      // proceed anyway — API may have already ended break
    }
    toast.success('Fin de pause — Reprise du poste');
    stopTimer();
    setStatus({ ...status, status: 'online', break_type: null });
    try {
      const data = await api.getAttendanceStatus();
      applyServerStatus(data);
    } catch (_) {}
  };

  if (loading) return null;

  const breakLabel = BREAK_LABELS[status?.break_type] || status?.break_type || '';

  return (
    <div className="bg-card border border-border rounded-[32px] p-6 shadow-xl mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
            status?.status === 'online' || status?.status === 'active' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
            status?.status === 'break' ? 'bg-amber-500 text-white shadow-amber-500/20' :
            'bg-slate-500 text-white shadow-slate-500/20'
          }`}>
            <Clock className={`w-7 h-7 ${status?.status === 'online' || status?.status === 'active'? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase italic tracking-tighter">Mon <span className="text-primary">Pointage</span></h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Statut : <span className={status?.status === 'online' || status?.status === 'active' ? 'text-emerald-500' : status?.status === 'break' ? 'text-amber-500' : 'text-slate-500'}>
                {status?.status === 'online' || status?.status === 'active' ? 'EN POSTE' : status?.status === 'break' ? `EN PAUSE (${breakLabel})` : 'HORS LIGNE'}
              </span>
            </p>
            {status?.status === 'break' && (
              <p className="text-lg font-mono font-bold text-amber-400 mt-1">
                {formatElapsed(pauseSeconds)}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!status || status?.status === 'offline' ? (
            <button onClick={handleClockIn} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all">
              Pointer Entrée
            </button>
          ) : (
            <>
              {status?.status === 'online' || status?.status === 'active' ? (
                <div className="flex flex-wrap gap-2">
                  {BREAK_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleStartBreak(opt.id)}
                      className={`px-4 py-3 ${PAUSE_BG[opt.color]} border border-current/10 ${PAUSE_TEXT[opt.color]} rounded-2xl font-black text-[10px] uppercase tracking-widest ${PAUSE_HOVER_BG[opt.color]} hover:text-white transition-all`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button onClick={handleClockOut} className="px-6 py-3 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all">Terminer Journée</button>
                </div>
              ) : (
                <button onClick={handleEndBreak} className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  Reprendre le poste
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgentDashboard() {
  const chartTheme = useChartTheme();
  const [saving, setSaving] = React.useState(false);
  const [stats, setStats] = React.useState<any>(null);
  const [recentCalls, setRecentCalls] = React.useState<any[]>([]);
  const [savedData, setSavedData] = React.useState<any>(null);

  React.useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAll = async () => {
    try {
      const [statsRes, callsRes, savedRes] = await Promise.allSettled([
        api.getStats(),
        api.getCalls({ limit: 5, offset: 0 }),
        api.getAgentSavedData(),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (callsRes.status === 'fulfilled') setRecentCalls(callsRes.value.calls || []);
      if (savedRes.status === 'fulfilled') setSavedData(savedRes.value);
    } catch (e) {
      console.error('Error loading agent dashboard:', e);
    }
  };

  const totalCalls = stats?.total_calls || 0;
  const avgScore = stats?.avg_score || 0;
  const positiveCalls = stats?.sentiment_distribution?.positive || 0;
  const conversionRate = totalCalls > 0 ? ((positiveCalls / totalCalls) * 100).toFixed(1) : '0.0';
  const workDuration = savedData?.calls_count
    ? `${Math.floor((savedData.calls_count * 6.4) / 60)}H ${Math.round((savedData.calls_count * 6.4) % 60)}M`
    : '0H 0M';

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveAgentData({
        notes: '',
        calls_count: totalCalls,
        conversions_count: positiveCalls,
        rdv_count: 0,
      });
      toast.success('Données sauvegardées !');
      loadAll();
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const hourlyData = React.useMemo(() => {
    if (!recentCalls.length) return [];
    const buckets: Record<string, { appels: number; conversions: number }> = {};
    for (let h = 8; h <= 18; h++) {
      const key = `${h.toString().padStart(2, '0')}:00`;
      buckets[key] = { appels: 0, conversions: 0 };
    }
    recentCalls.forEach((c: any) => {
      const d = c.call_date ? new Date(c.call_date) : null;
      if (d) {
        const key = `${d.getHours().toString().padStart(2, '0')}:00`;
        if (buckets[key]) {
          buckets[key].appels++;
          if (c.sentiment === 'positive' || c.performance === 'bon') buckets[key].conversions++;
        }
      }
    });
    return Object.entries(buckets).map(([hour, data]) => ({ hour, ...data }));
  }, [recentCalls]);

  const callStatusMap: Record<string, { bg: string; text: string }> = {
    Converti: { bg: 'bg-success/10', text: 'text-success' },
    'Refusé': { bg: 'bg-destructive/10', text: 'text-destructive' },
    Rappel: { bg: 'bg-warning/10', text: 'text-warning' },
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">Mon <span className="text-primary">Dashboard</span></h2>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

        <AttendanceManager />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 border-b-4 border-indigo-900/20 transform hover:scale-[1.02] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-xl backdrop-blur-md">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-white">Quotidien</span>
            </div>
            <h3 className="text-sm font-black uppercase tracking-tighter opacity-80 italic text-white">Appels du jour</h3>
            <p className="text-4xl font-black italic tracking-tighter mt-1 text-white">{totalCalls}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20 border-b-4 border-emerald-900/20 transform hover:scale-[1.02] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-xl backdrop-blur-md">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-white">Réussite</span>
            </div>
            <h3 className="text-sm font-black uppercase tracking-tighter opacity-80 italic text-white">Conversions</h3>
            <p className="text-4xl font-black italic tracking-tighter mt-1 text-white">{positiveCalls}</p>
            <p className="text-[10px] font-black uppercase mt-2 inline-flex items-center gap-1 bg-white/20 dark:bg-slate-900/20 px-2 py-1 rounded-full text-white">
              TAUX: {conversionRate}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-3xl p-6 text-white shadow-xl shadow-amber-500/20 border-b-4 border-amber-900/20 transform hover:scale-[1.02] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-xl backdrop-blur-md">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-white">Actif</span>
            </div>
            <h3 className="text-sm font-black uppercase tracking-tighter opacity-80 italic text-white">Temps productif</h3>
            <p className="text-4xl font-black italic tracking-tighter mt-1 text-white">{workDuration}</p>
          </div>

          <div className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-3xl p-6 text-white shadow-xl shadow-rose-500/20 border-b-4 border-rose-900/20 transform hover:scale-[1.02] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-xl backdrop-blur-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-white">Niveau</span>
            </div>
            <h3 className="text-sm font-black uppercase tracking-tighter opacity-80 italic text-white">Score Qualité</h3>
            <p className="text-4xl font-black italic tracking-tighter mt-1 text-white">{avgScore > 0 ? `${Math.round(avgScore)}/100` : '—'}</p>
          </div>
        </div>

        {hourlyData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="mb-4">Performance du jour</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="colorAppels" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                  <XAxis dataKey="hour" stroke={chartTheme.textColor} tick={{ fontSize: 10, fontWeight: 700, fill: chartTheme.textColor }} />
                  <YAxis stroke={chartTheme.textColor} tick={{ fontSize: 10, fontWeight: 700, fill: chartTheme.textColor }} />
                  <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="appels" stroke="#6366f1" strokeWidth={3} fill="url(#colorAppels)" name="Appels" />
                  <Area type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={3} fill="url(#colorConversions)" name="Conversions" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="mb-4">Taux de conversion par heure</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                  <XAxis dataKey="hour" stroke={chartTheme.textColor} tick={{ fontSize: 10, fontWeight: 700, fill: chartTheme.textColor }} />
                  <YAxis stroke={chartTheme.textColor} tick={{ fontSize: 10, fontWeight: 700, fill: chartTheme.textColor }} />
                  <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  <Legend />
                  <Bar dataKey="appels" fill="var(--color-chart-1)" name="Appels" />
                  <Bar dataKey="conversions" fill="var(--color-chart-4)" name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border">
            <h3>Appels récents</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-muted-foreground">Agent</th>
                  <th className="text-left p-4 text-muted-foreground">Sentiment</th>
                  <th className="text-left p-4 text-muted-foreground">Score</th>
                  <th className="text-left p-4 text-muted-foreground">Performance</th>
                  <th className="text-left p-4 text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentCalls.length > 0 ? recentCalls.map((call: any) => {
                  const sentimentCfg = callStatusMap[call.sentiment] || callStatusMap['Rappel'];
                  return (
                    <tr key={call.call_id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-foreground">{call.agent_name || '—'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${sentimentCfg.bg} ${sentimentCfg.text}`}>
                          {call.sentiment || '—'}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">{call.score_percentage != null ? `${call.score_percentage}%` : '—'}</td>
                      <td className="p-4">{call.performance || '—'}</td>
                      <td className="p-4 text-muted-foreground">
                        {call.call_date ? new Date(call.call_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Aucun appel récent
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
