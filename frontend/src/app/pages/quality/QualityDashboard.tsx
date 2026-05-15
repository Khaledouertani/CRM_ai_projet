import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, TrendingUp, Target, Mic, Star, 
  ChevronRight, Search, Filter, ArrowUpRight, 
  ArrowDownRight, ShieldCheck, Zap, CheckCircle2, AlertCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import api from '../../services/api';
import { useChartTheme } from '../../hooks/useChartTheme';

// Mock data for agents
const AGENTS_DATA = [
  { id: 1, name: 'Marie Dubois', qualityScore: 88, conversion: 12.5, calls: 145, trend: 'up' },
  { id: 2, name: 'Pierre Leroy', qualityScore: 76, conversion: 8.2, calls: 132, trend: 'down' },
  { id: 3, name: 'Sophie Martin', qualityScore: 92, conversion: 15.1, calls: 156, trend: 'up' },
  { id: 4, name: 'Thomas Bernard', qualityScore: 81, conversion: 10.4, calls: 128, trend: 'up' },
  { id: 5, name: 'Lucie Petit', qualityScore: 65, conversion: 5.8, calls: 110, trend: 'down' },
];

const QUALITY_TRENDS = [
  { name: 'Lun', score: 78 },
  { name: 'Mar', score: 82 },
  { name: 'Mer', score: 80 },
  { name: 'Jeu', score: 85 },
  { name: 'Ven', score: 88 },
];

export default function QualityDashboard() {
  const chartTheme = useChartTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [agents, setAgents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    avgQuality: 0,
    compliance: 0,
    alerts: 0,
    totalCalls: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [perfData, overview] = await Promise.all([
          api.getAgentsPerformance(),
          api.getAnalyticsOverview()
        ]);
        
        setAgents(perfData);
        setStats({
          avgQuality: Math.round(overview.global_score || 82),
          compliance: Math.round(overview.compliance_rate || 94),
          alerts: overview.critical_alerts || 3,
          totalCalls: overview.total_calls || 0
        });
      } catch (error) {
        console.error("Failed to fetch quality data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header avec Stats Rapides */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter text-gray-900 dark:text-white uppercase">Service <span className="text-[#00D4FF]">Qualité</span></h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Analyse de performance et conformité IA</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-[#1E293B] border border-blue-500/20 rounded-2xl flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Live Monitoring</span>
          </div>
        </div>
      </div>

      {/* Grid de Stats Globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Score Qualité Global', value: `${stats.avgQuality}%`, icon: ShieldCheck, color: 'text-blue-400', trend: '+2.4%' },
          { label: 'Taux de Conformité', value: `${stats.compliance}%`, icon: Star, color: 'text-amber-400', trend: '+1.1%' },
          { label: 'Alertes Critiques', value: stats.alerts.toString().padStart(2, '0'), icon: Zap, color: 'text-red-400', trend: '-50%' },
          { label: 'Appels Analysés', value: stats.totalCalls.toLocaleString(), icon: Mic, color: 'text-emerald-400', trend: '+12%' },
        ].map((stat, i) => (
          <div key={stat.label} className="bg-[#1E293B] border border-blue-500/10 p-6 rounded-[24px] relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className="w-12 h-12" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</h3>
              <span className={`text-[10px] font-bold mb-1 ${stat.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Liste des Agents (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1E293B] border border-blue-500/10 rounded-[32px] overflow-hidden">
            <div className="p-6 border-b border-blue-500/10 flex items-center justify-between">
              <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-white">Performances Agents</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="RECHERCHER AGENT..."
                  className="bg-[#0F172A] border border-blue-500/10 rounded-xl pl-10 pr-4 py-2 text-[10px] font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#00D4FF]/50 transition-all uppercase tracking-widest"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-blue-500/5 bg-blue-500/5">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Agent</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Qualité IA</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Conversion</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Appels</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-500/5">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-8 h-8 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Chargement des données réelles...</p>
                        </div>
                      </td>
                    </tr>
                  ) : agents.filter(a => (a.agent_name || a.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(agent => (
                    <tr key={agent.id} className="hover:bg-blue-500/5 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-black text-gray-900 dark:text-white text-xs shadow-lg">
                            {(agent.agent_name || agent.name || 'A').split(' ').map((n: any) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{agent.agent_name || agent.name}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Agent Certifié</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-sm font-black ${(agent.score_percentage || agent.qualityScore) > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {Math.round(agent.score_percentage || agent.qualityScore || 0)}%
                          </span>
                          <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full ${(agent.score_percentage || agent.qualityScore) > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${agent.score_percentage || agent.qualityScore || 0}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{agent.conversion_rate || agent.conversion || 0}%</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">{agent.total_calls || agent.calls || 0}</span>
                          <button 
                            onClick={() => navigate('/qualite/agents')}
                            className="px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-amber-500/20 transition-all flex items-center gap-2 group"
                          >
                            <Star className="w-3 h-3 fill-current group-hover:rotate-12 transition-transform" />
                            Évaluer
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all group-hover:scale-110">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Insights & Graph (1/3) */}
        <div className="space-y-8">
          
          {/* Tendance Qualité */}
          <div className="bg-[#1E293B] border border-blue-500/10 p-6 rounded-[32px]">
            <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-white mb-6">Tendance Qualité Hebdo</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={QUALITY_TRENDS}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                  <XAxis dataKey="name" stroke={chartTheme.textColor} fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={chartTheme.tooltipStyle}
                    itemStyle={{ color: '#00D4FF', fontSize: '10px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#00D4FF" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* IA Insights */}
          <div className="bg-gradient-to-br from-[#2563EB]/10 to-transparent border border-blue-500/20 p-6 rounded-[32px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Zap className="w-8 h-8 text-[#00D4FF] animate-pulse" />
            </div>
            <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-white mb-4">Recommandations Stratégiques IA</h3>
            <div className="space-y-4">
              <div className="p-3 bg-[#0F172A]/50 border border-blue-500/10 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Optimisation Closing</p>
                </div>
                <p className="text-[11px] font-medium text-slate-300 leading-relaxed">
                  Baisse de **12%** du closing sur l'équipe B. L'IA détecte une hésitation lors de l'annonce du tarif. Planifier un atelier **"Posture de Vente"**.
                </p>
              </div>
              <div className="p-3 bg-[#0F172A]/50 border border-emerald-500/10 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Alerte Conformité</p>
                </div>
                <p className="text-[11px] font-medium text-slate-300 leading-relaxed">
                  Conformité légale à **98%**. Sophie M. et Thomas B. sont excellents sur la mention des mentions RGPD. À utiliser comme modèles.
                </p>
              </div>
              <div className="p-3 bg-[#0F172A]/50 border border-amber-500/10 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Détection Refus</p>
                </div>
                <p className="text-[11px] font-medium text-slate-300 leading-relaxed">
                  Hausse des refus sur l'objection "Déjà équipé". Suggérer l'argumentaire **"Différenciation Premium"** à l'ensemble du plateau.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
