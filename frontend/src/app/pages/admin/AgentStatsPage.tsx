import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Award, AlertCircle, Loader2, Star, Target, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import api from '../../services/api';
import { useChartTheme } from '../../hooks/useChartTheme';

const tooltipStyle = {
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  color: 'var(--foreground)',
};

export default function AgentStatsPage() {
  const chartTheme = useChartTheme();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [agentData, setAgentData] = useState<any>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const data = await api.getAgentsPerformance();
      setAgents(data);
      if (data.length > 0) {
        setSelectedAgent(data[0].agent_name);
      }
    } catch (e) {
      console.error('Error loading agents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAgent) {
      loadAgentDetails(selectedAgent);
    }
  }, [selectedAgent]);

  const loadAgentDetails = async (name: string) => {
    try {
      // Pour l'instant on réutilise les données de la liste, 
      // mais on pourrait appeler un endpoint dédié /api/stats?agent_name=...
      const data = await api.getStats(name);
      setAgentData(data);
    } catch (e) {
      console.error('Error loading agent details:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-muted-foreground">Analyse des performances...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2>Performances Individuelles</h2>
          <p className="text-muted-foreground mt-1">Analyse détaillée par agent</p>
        </div>
        
        <div className="flex items-center gap-3 bg-card p-1 rounded-lg border border-border">
          <span className="text-xs font-medium px-3 text-muted-foreground uppercase">Agent :</span>
          <select 
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer pr-8"
          >
            {agents.map(a => (
              <option key={a.agent_name} value={a.agent_name} className="bg-card">{a.agent_name}</option>
            ))}
          </select>
        </div>
      </div>

      {agentData && (
        <>
          {/* KPI Mini Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="Qualité Moyenne" value={`${agentData.avg_score}%`} icon={Award} color="primary" />
            <StatCard title="Total Appels" value={agentData.total_calls} icon={Users} color="info" />
            <StatCard title="Positifs" value={agentData.sentiment_distribution?.POSITIVE || 0} icon={Star} color="success" />
            <StatCard title="Négatifs" value={agentData.sentiment_distribution?.NEGATIVE || 0} icon={AlertCircle} color="destructive" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Competence Radar */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning" />
                Matrice des compétences
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={[
                    { subject: 'Écoute', A: 85 },
                    { subject: 'Persuasion', A: 70 },
                    { subject: 'Empathie', A: 90 },
                    { subject: 'Vente', A: 65 },
                    { subject: 'Refus', A: 75 },
                    { subject: 'Clarté', A: 80 },
                  ]}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Radar 
                      name="Agent" 
                      dataKey="A" 
                      stroke="#818cf8" 
                      fill="#818cf8" 
                      fillOpacity={0.7} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Trend */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Évolution de la qualité hebdomadaire
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { day: 'Lun', score: 68 },
                    { day: 'Mar', score: 72 },
                    { day: 'Mer', score: agentData.avg_score - 5 },
                    { day: 'Jeu', score: agentData.avg_score + 2 },
                    { day: 'Ven', score: agentData.avg_score },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.2} vertical={false} />
                    <XAxis dataKey="day" stroke={chartTheme.textColor} />
                    <YAxis stroke={chartTheme.textColor} />
                    <Tooltip contentStyle={chartTheme.tooltipStyle} />
                    <Line type="monotone" dataKey="score" stroke="#4ade80" strokeWidth={5} dot={{ r: 6, fill: '#4ade80' }} activeDot={{ r: 10 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Feedback Card */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white dark:bg-slate-900 dark:bg-slate-900 rounded-full shadow-sm">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-foreground mb-1">Recommandation IA pour {selectedAgent}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  L'IA a détecté une excellente capacité d'empathie chez cet agent. Cependant, le taux de conversion 
                  pourrait être amélioré en travaillant sur la phase d'argumentation technique. 
                  Nous recommandons une session de coaching focalisée sur les "techniques de clôture" (Closing).
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="px-2 py-1 rounded bg-success/20 text-success text-[10px] font-bold uppercase tracking-wider">Point fort : Empathie</span>
                  <span className="px-2 py-1 rounded bg-warning/20 text-warning text-[10px] font-bold uppercase tracking-wider">Axe : Argumentation</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: any, icon: any, color: string }) {
  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{title}</span>
        <Icon className={`w-4 h-4 text-${color}`} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
