import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Users, Target, TrendingUp, Zap, 
  ArrowRightLeft, ChevronDown, Award,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { useChartTheme } from '../../hooks/useChartTheme';

const AGENTS = [
  { id: 1, name: 'Marie Dubois', scores: { listening: 85, persuasion: 70, empathy: 90, argumentation: 75, objections: 60, closing: 50 }, conversion: 12.5, calls: 145 },
  { id: 2, name: 'Pierre Leroy', scores: { listening: 75, persuasion: 60, empathy: 70, argumentation: 85, objections: 80, closing: 75 }, conversion: 18.2, calls: 132 },
  { id: 3, name: 'Sophie Martin', scores: { listening: 95, persuasion: 85, empathy: 95, argumentation: 90, objections: 75, closing: 85 }, conversion: 22.1, calls: 156 },
];

export default function QualityComparison() {
  const chartTheme = useChartTheme();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [agent1Id, setAgent1Id] = useState<number>(0);
  const [agent2Id, setAgent2Id] = useState<number>(0);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await api.getAgentsPerformance();
        setAgents(data);
        if (data.length >= 2) {
          setAgent1Id(data[0].id);
          setAgent2Id(data[1].id);
        } else if (data.length === 1) {
          setAgent1Id(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching comparison data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const agent1 = agents.find(a => a.id === agent1Id) || { agent_name: 'Agent A', score_percentage: 0, conversion_rate: 0, total_calls: 0 };
  const agent2 = agents.find(a => a.id === agent2Id) || { agent_name: 'Agent B', score_percentage: 0, conversion_rate: 0, total_calls: 0 };

  const radarData = [
    { subject: 'Écoute', A: 85, B: 75, fullMark: 100 },
    { subject: 'Persuasion', A: 70, B: 60, fullMark: 100 },
    { subject: 'Empathie', A: 90, B: 70, fullMark: 100 },
    { subject: 'Argument.', A: 75, B: 85, fullMark: 100 },
    { subject: 'Objections', A: 60, B: 80, fullMark: 100 },
    { subject: 'Closing', A: 50, B: 75, fullMark: 100 },
  ];

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header & Selection */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-[#1E293B] border border-blue-500/10 p-8 rounded-[32px]">
        
        {/* Agent 1 Select */}
        <div className="flex-1 w-full space-y-4">
          <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2">Agent Comparatif A</label>
          <div className="relative group">
            <select 
              value={agent1Id}
              onChange={(e) => setAgent1Id(Number(e.target.value))}
              className="w-full bg-[#0F172A] border border-blue-500/20 rounded-2xl p-4 text-sm font-black text-gray-900 dark:text-white appearance-none focus:outline-none focus:border-blue-500 transition-all cursor-pointer uppercase tracking-tight"
            >
              <option value="0">Sélectionner Agent A...</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.agent_name || a.name}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
          <div className="flex items-center gap-4 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/5">
            <div className="w-12 h-12 bg-[#2563EB] rounded-xl flex items-center justify-center font-black text-gray-900 dark:text-white shadow-lg">
              {(agent1.agent_name || 'A').split(' ').map((n: any) => n[0]).join('')}
            </div>
            <div>
              <p className="text-xs font-black text-gray-900 dark:text-white uppercase">{agent1.agent_name || agent1.name || '---'}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase">Conversion: {agent1.conversion_rate || 0}%</p>
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
            <ArrowRightLeft className="w-6 h-6 text-[#00D4FF]" />
          </div>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">VS</span>
        </div>

        {/* Agent 2 Select */}
        <div className="flex-1 w-full space-y-4">
          <label className="text-[10px] font-black text-[#00D4FF] uppercase tracking-widest ml-2">Agent Comparatif B</label>
          <div className="relative group">
            <select 
              value={agent2Id}
              onChange={(e) => setAgent2Id(Number(e.target.value))}
              className="w-full bg-[#0F172A] border border-[#00D4FF]/20 rounded-2xl p-4 text-sm font-black text-gray-900 dark:text-white appearance-none focus:outline-none focus:border-[#00D4FF] transition-all cursor-pointer uppercase tracking-tight"
            >
              <option value="0">Sélectionner Agent B...</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.agent_name || a.name}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
          <div className="flex items-center gap-4 p-4 bg-[#00D4FF]/5 rounded-2xl border border-[#00D4FF]/5">
            <div className="w-12 h-12 bg-[#00D4FF] rounded-xl flex items-center justify-center font-black text-[#0F172A] shadow-lg">
              {(agent2.agent_name || 'B').split(' ').map((n: any) => n[0]).join('')}
            </div>
            <div>
              <p className="text-xs font-black text-gray-900 dark:text-white uppercase">{agent2.agent_name || agent2.name || '---'}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase">Conversion: {agent2.conversion_rate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Radar Comparison (2/3) */}
        <div className="lg:col-span-2 bg-[#1E293B] border border-blue-500/10 p-8 rounded-[32px] flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-8">
            <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-white">Analyse Radar Comparative</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#2563EB]" /><span className="text-[9px] font-black text-slate-400 uppercase">{agent1.name}</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#00D4FF]" /><span className="text-[9px] font-black text-slate-400 uppercase">{agent2.name}</span></div>
            </div>
          </div>
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#1E293B" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name={agent1.name}
                  dataKey="A"
                  stroke="#2563EB"
                  fill="#2563EB"
                  fillOpacity={0.4}
                />
                <Radar
                  name={agent2.name}
                  dataKey="B"
                  stroke="#00D4FF"
                  fill="#00D4FF"
                  fillOpacity={0.3}
                />
                <Tooltip 
                   contentStyle={chartTheme.tooltipStyle}
                   itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Verdict & KPIs */}
        <div className="space-y-8">
          
          {/* AI Comparison Insight */}
          <div className="bg-gradient-to-br from-[#2563EB]/10 to-transparent border border-blue-500/20 p-8 rounded-[32px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-20"><Zap className="w-10 h-10 text-[#00D4FF] animate-pulse" /></div>
            <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-white mb-6">Verdict IA</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-[11px] font-medium text-slate-300 leading-relaxed">
                  <span className="text-gray-900 dark:text-white font-black">{agent2.name}</span> domine sur le **Closing** et la **Gestion des Objections** (+25%).
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-[11px] font-medium text-slate-300 leading-relaxed">
                   <span className="text-gray-900 dark:text-white font-black">{agent1.name}</span> conserve un avantage sur l'**Empathie** et l'**Écoute active**.
                </p>
              </div>
              <div className="p-4 bg-[#0F172A]/50 border border-blue-500/10 rounded-2xl">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Recommandation Stratégique</p>
                <p className="text-[11px] font-bold text-gray-900 dark:text-white italic leading-relaxed">
                  "Utiliser les enregistrements de {agent2.name} pour former {agent1.name} sur les techniques de rebond commercial."
                </p>
              </div>
            </div>
          </div>

          {/* Table Comparison Small */}
          <div className="bg-[#1E293B] border border-blue-500/10 p-6 rounded-[32px] overflow-hidden">
             <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-white mb-6">Différentiel KPIs</h3>
              <div className="space-y-4">
                 {[
                   { label: 'Conversion', v1: agent1.conversion_rate || 0, v2: agent2.conversion_rate || 0, unit: '%' },
                   { label: 'Volume Appels', v1: agent1.total_calls || 0, v2: agent2.total_calls || 0, unit: '' },
                   { label: 'Qualité IA', v1: agent1.score_percentage || 0, v2: agent2.score_percentage || 0, unit: '%' },
                 ].map((kpi, i) => {
                  const diff = kpi.v2 - kpi.v1;
                  return (
                    <div key={kpi.label} className="flex flex-col gap-2 p-3 bg-[#0F172A]/30 rounded-xl">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase">{kpi.label}</span>
                        <span className={`text-[10px] font-black ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {diff > 0 ? `+${diff}` : diff}{kpi.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2563EB]" style={{ width: `${(kpi.v1 / (kpi.v1 + kpi.v2)) * 100}%` }} />
                        <div className="h-full bg-[#00D4FF]" style={{ width: `${(kpi.v2 / (kpi.v1 + kpi.v2)) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
