import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, Coffee, Utensils, Users, Search, PlayCircle,
  PauseCircle, Timer, Wifi, WifiOff, UserCheck, UserX,
  ArrowUpDown, RefreshCw, AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';


const BREAK_LIMITS: Record<string, number> = {
  'Café': 15,
  'Déjeuner': 60,
  'Réunion': 120,
  'Permission': 15,
  'Perso': 15,
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m ${s.toString().padStart(2, '0')}s`;
}

function getBreakProgress(start: string, limitMin: number): { elapsed: number; percent: number; over: boolean } {
  const elapsed = Math.floor((Date.now() - new Date(start).getTime()) / 1000);
  const limitSec = limitMin * 60;
  const percent = Math.min(100, (elapsed / limitSec) * 100);
  return { elapsed, percent, over: elapsed > limitSec };
}

export default function QualityAttendance() {
  const [editStatus, setEditStatus] = useState("");
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'work'>('status');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const handleEdit = (agent: any) => {
    console.log("EDIT AGENT =", agent);

    setSelectedAgent(agent);

    const editMap: Record<string, string> = { active: 'online', break: 'break', offline: 'offline' };
    setEditStatus(editMap[agent.status] || 'offline');

    setShowEditModal(true);
  };
  const saveAttendance = async () => {
    try {
      const statusMap: Record<string, string> = { online: 'active', break: 'break', offline: 'offline' };

      await api.updateAttendance(
        selectedAgent.user_id,
        {
          status: statusMap[editStatus] || editStatus
        }
      );

      alert("Pointage modifié");

      setShowEditModal(false);

    } catch (error) {
      console.error(error);

      alert("Erreur modification");
    }
  };
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const fetchAttendance = useCallback(async () => {
    try {
      const data = await api.getAttendanceTeamDetail();

      console.log("TEAM DETAIL =", data);
      console.log(data[0]);

      if (Array.isArray(data)) {
        setReport(data.filter((a: any) => a.user_role === "agent"));
      } else if (data && Array.isArray((data as any).records)) {
        setReport((data as any).records.filter((a: any) => a.user_role === "agent"));
      } else {
        setReport([]);
      }
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Attendance fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 5000);
    return () => clearInterval(interval);
  }, [fetchAttendance]);


  const onlineCount =
    report.filter(a => a.status === "active").length;

  const breakCount =
    report.filter(a => a.status === "break").length;

  const offlineCount =
    report.filter(a =>
      a.status !== "active" &&
      a.status !== "break"
    ).length;


  const filtered = report
    .filter(r =>
      (r.user_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'name')
        return dir * (a.user_name || "").localeCompare(b.user_name || "");
      if (sortBy === 'status') {
        const order: Record<string, number> = { active: 0, break: 1, offline: 2 };
        return dir * ((order[a.status] ?? 3) - (order[b.status] ?? 3));
      }
      if (sortBy === 'work') return dir * ((a.work_duration_minutes || 0) - (b.work_duration_minutes || 0));
      return 0;
    });

  const toggleSort = (col: 'name' | 'status' | 'work') => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  return (
    <div className="min-h-screen bg-[#0d0d1a] p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Supervision <span className="text-[#7c3aed]">Pointage</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
              Temps réel · Rafraîchissement 5s · Dernière MAJ: {lastRefresh.toLocaleTimeString('fr-FR')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher agent..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:border-[#7c3aed] focus:outline-none transition-colors"
              />
            </div>
            <button
              onClick={fetchAttendance}
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { label: 'En poste', value: onlineCount, icon: UserCheck, color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400' },
            { label: 'En pause', value: breakCount, icon: Coffee, color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400' },
            { label: 'Hors ligne', value: offlineCount, icon: UserX, color: 'from-slate-500/20 to-gray-500/20 border-slate-500/30 text-slate-400' },
            { label: 'Total agents', value: report.length, icon: Users, color: 'from-[#7c3aed]/20 to-purple-500/20 border-[#7c3aed]/30 text-[#7c3aed]' },
          ].map(kpi => (
            <div key={kpi.label} className={`bg-gradient-to-br ${kpi.color} rounded-xl p-4 border backdrop-blur-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-2xl font-bold text-white">{kpi.value}</p>
                </div>
                <kpi.icon className="w-6 h-6 opacity-40 text-gray-500" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Table */}
        <div className="bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#7c3aed]" /> État des Agents
            </h3>
            <span className="text-[10px] text-gray-500">{filtered.length} agents</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.02]">
                  {[
                    { key: 'name', label: 'Agent' },
                    { key: 'status', label: 'Statut' },
                    { key: 'work', label: 'Temps travail' },
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key as any)}
                      className="text-left px-5 py-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest cursor-pointer hover:text-gray-300 transition-colors"
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                  ))}

                  <th className="text-left px-5 py-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest">Pause</th>
                  <th className="text-left px-5 py-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest">Limite</th>
                  <th className="text-left px-5 py-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((agent, index) => {
                  const isOnline =
                    agent.status === "active";

                  const isBreak =
                    agent.status === "break";
                  const breakInfo = isBreak ? getBreakProgress(agent.current_break_start || new Date().toISOString(), BREAK_LIMITS[agent.current_break_type] || 15) : null;
                  const limitMin = BREAK_LIMITS[agent.current_break_type] || 15;

                  return (
                    <tr
                      key={`${agent.user_id}-${index}`}
                      className={`hover:bg-white/[0.02] transition-colors ${isBreak && breakInfo?.over ? 'bg-red-500/5' : ''}`}
                    >                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : isBreak ? 'bg-amber-400' : 'bg-gray-600'}`} />
                          <div>
                            <p className="text-xs font-semibold text-white">
                              {agent.user_name}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {agent.clock_in ? new Date(agent.clock_in).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-500/20">
                            <PlayCircle className="w-3 h-3" /> EN POSTE
                          </span>
                        ) : isBreak ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-full text-[10px] font-bold border border-amber-500/20">
                            <Coffee className="w-3 h-3" /> {agent.current_break_type || 'PAUSE'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-500/10 text-slate-500 rounded-full text-[10px] font-bold border border-slate-500/20">
                            <WifiOff className="w-3 h-3" /> HORS LIGNE
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-mono text-gray-300">
                          {agent.work_duration_minutes != null
                            ? `${Math.floor(agent.work_duration_minutes)} min`
                            : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-mono text-amber-400/80">{agent.total_break_minutes != null
                          ? `${Math.floor(agent.total_break_minutes)} min`
                          : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {isBreak && breakInfo ? (
                          <div className="space-y-1 min-w-[120px]">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className={breakInfo.over ? 'text-red-400 font-bold flex items-center gap-1' : 'text-gray-400'}>
                                {breakInfo.over && <AlertCircle className="w-3 h-3" />}
                                {formatDuration(breakInfo.elapsed)}
                              </span>
                              <span className="text-gray-600">/ {limitMin}min</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${breakInfo.over ? 'bg-red-500 animate-pulse' : breakInfo.percent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, breakInfo.percent)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleEdit(agent)}
                        >
                          Modifier
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && !loading && (
              <div className="p-12 text-center text-gray-500">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-xs">Aucun agent trouvé</p>
              </div>
            )}
          </div>
        </div>

        {/* Movement Timeline */}
        <div className="bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-white/5 p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Timer className="w-4 h-4 text-[#7c3aed]" /> Derniers Mouvements
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin pr-2">
            {report
              .flatMap(a => (a.history || []).map((evt: any) => ({ ...evt, agent_name: a.user_name })))
              .sort((a: any, b: any) => new Date(b.time || b.timestamp || 0).getTime() - new Date(a.time || a.timestamp || 0).getTime())
              .slice(0, 20)
              .map((evt: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${evt.type?.includes('clock_in') || evt.type?.includes('break_end') ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="text-[10px] text-gray-400 font-mono shrink-0">
                    {evt.time ? new Date(evt.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </span>
                  <span className="text-[10px] text-white font-medium">{evt.agent_name}</span>
                  <span className="text-[10px] text-gray-500">{evt.type}</span>
                </div>
              ))}
            {report.every(a => !a.history || a.history.length === 0) && (
              <p className="text-[10px] text-gray-600 text-center py-6">Aucun mouvement enregistré</p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width:4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background:transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background:rgba(124,58,237,0.3); border-radius:4px; }
      `}</style>
      {showEditModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,6,23,0.85)",
            backdropFilter: "blur(10px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999
          }}
        >
          <div
            style={{
              width: "420px",
              background: "linear-gradient(180deg, #111827 0%, #0F172A 100%)",
              border: "1px solid rgba(139,126,245,0.2)",
              borderRadius: "24px",
              padding: "24px",
              color: "#F8FAFC",
              boxShadow: "0 25px 50px rgba(0,0,0,0.45)"
            }}
          >
            <h3
              style={{
                fontSize: "22px",
                fontWeight: 700,
                marginBottom: "8px",
                color: "#F8FAFC"
              }}
            >
              Modifier Pointage
            </h3>

            <div
              style={{
                marginBottom: "18px",
                color: "#94A3B8",
                fontSize: "14px"
              }}
            >
              {selectedAgent?.user_name}
            </div>

            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                background: "#11161F",
                color: "#F8FAFC",
                border: "1px solid #252E3A",
                borderRadius: "14px",
                outline: "none",
                marginBottom: "24px"
              }}
            >
              <option value="online">🟢 En poste</option>
              <option value="break">🟠 En pause</option>
              <option value="offline">⚫ Hors ligne</option>
            </select>

            <div
              style={{
                display: "flex",
                gap: "12px"
              }}
            >
              <button
                onClick={saveAttendance}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "14px",
                  border: "none",
                  background: "linear-gradient(90deg,#8B7EF5,#5D9BFF)",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Enregistrer
              </button>

              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "14px",
                  border: "1px solid #252E3A",
                  background: "#11161F",
                  color: "#CBD5E1",
                  cursor: "pointer"
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>

      )}
    </div>
  );
}
