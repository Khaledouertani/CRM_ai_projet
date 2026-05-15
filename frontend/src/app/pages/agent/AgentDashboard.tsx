import React from 'react';
import { Phone, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useChartTheme } from '../../hooks/useChartTheme';

const performanceData = [
  { time: '08:00', appels: 4, conversions: 2 },
  { time: '09:00', appels: 8, conversions: 5 },
  { time: '10:00', appels: 12, conversions: 7 },
  { time: '11:00', appels: 10, conversions: 6 },
  { time: '12:00', appels: 6, conversions: 3 },
  { time: '13:00', appels: 5, conversions: 2 },
  { time: '14:00', appels: 11, conversions: 8 }
];

const recentCalls = [
  { id: 1, company: 'Société ABC', contact: 'Jean Dupont', duration: '5:32', status: 'Converti', time: '14:23' },
  { id: 2, company: 'Entreprise XYZ', contact: 'Marie Martin', duration: '3:15', status: 'Refusé', time: '14:10' },
  { id: 3, company: 'Solutions Pro', contact: 'Pierre Leroy', duration: '8:45', status: 'Converti', time: '13:55' },
  { id: 4, company: 'Tech Innovate', contact: 'Sophie Bernard', duration: '2:30', status: 'Rappel', time: '13:40' },
  { id: 5, company: 'Digital Services', contact: 'Luc Moreau', duration: '6:12', status: 'Converti', time: '13:20' }
];

export default function AgentDashboard() {
  const chartTheme = useChartTheme();
  return (
    <>
      <div className="space-y-6">
        <div>
          <h2>Mon Tableau de Bord</h2>
          <p className="text-muted-foreground mt-1">Vue d'ensemble de votre activité du jour</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 border-b-4 border-indigo-900/20 transform hover:scale-[1.02] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-xl backdrop-blur-md">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-white">Quotidien</span>
            </div>
            <h3 className="text-sm font-black uppercase tracking-tighter opacity-80 italic text-white">Appels du jour</h3>
            <p className="text-4xl font-black italic tracking-tighter mt-1 text-white">56</p>
            <p className="text-[10px] font-black uppercase mt-2 inline-flex items-center gap-1 bg-white/20 dark:bg-slate-900/20 px-2 py-1 rounded-full text-white">
              <TrendingUp className="w-3 h-3" /> +12% VS HIER
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20 border-b-4 border-emerald-900/20 transform hover:scale-[1.02] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-xl backdrop-blur-md">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-white">Réussite</span>
            </div>
            <h3 className="text-sm font-black uppercase tracking-tighter opacity-80 italic text-white">Conversions</h3>
            <p className="text-4xl font-black italic tracking-tighter mt-1 text-white">33</p>
            <p className="text-[10px] font-black uppercase mt-2 inline-flex items-center gap-1 bg-white/20 dark:bg-slate-900/20 px-2 py-1 rounded-full text-white">
              TAUX: 58.9%
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
            <p className="text-4xl font-black italic tracking-tighter mt-1 text-white">6H 24M</p>
            <p className="text-[10px] font-black uppercase mt-2 inline-flex items-center gap-1 bg-white/20 dark:bg-slate-900/20 px-2 py-1 rounded-full text-white">
              80% DU TEMPS TOTAL
            </p>
          </div>

          <div className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-3xl p-6 text-white shadow-xl shadow-rose-500/20 border-b-4 border-rose-900/20 transform hover:scale-[1.02] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-xl backdrop-blur-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-white">Niveau</span>
            </div>
            <h3 className="text-sm font-black uppercase tracking-tighter opacity-80 italic text-white">Score Qualité</h3>
            <p className="text-4xl font-black italic tracking-tighter mt-1 text-white">92/100</p>
            <p className="text-[10px] font-black uppercase mt-2 inline-flex items-center gap-1 bg-white/20 dark:bg-slate-900/20 px-2 py-1 rounded-full text-white">
              +5 POINTS
            </p>
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="mb-4">Performance du jour</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
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
                <XAxis dataKey="time" stroke={chartTheme.textColor} tick={{ fontSize: 10, fontWeight: 700, fill: chartTheme.textColor }} />
                <YAxis stroke={chartTheme.textColor} tick={{ fontSize: 10, fontWeight: 700, fill: chartTheme.textColor }} />

                <Tooltip
                  contentStyle={chartTheme.tooltipStyle}
                />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="appels" stroke="#6366f1" strokeWidth={3} fill="url(#colorAppels)" dot={{ fill: chartTheme.textColor, r: 4, strokeWidth: 2, stroke: '#6366f1' }} name="Appels" />
                <Area type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={3} fill="url(#colorConversions)" dot={{ fill: chartTheme.textColor, r: 4, strokeWidth: 2, stroke: '#10b981' }} name="Conversions" />

              </AreaChart>

            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="mb-4">Taux de conversion par heure</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                <XAxis dataKey="time" stroke={chartTheme.textColor} tick={{ fontSize: 10, fontWeight: 700, fill: chartTheme.textColor }} />
                <YAxis stroke={chartTheme.textColor} tick={{ fontSize: 10, fontWeight: 700, fill: chartTheme.textColor }} />

                <Tooltip
                  contentStyle={chartTheme.tooltipStyle}
                />
                <Legend />
                <Bar dataKey="appels" fill="var(--color-chart-1)" name="Appels" />
                <Bar dataKey="conversions" fill="var(--color-chart-4)" name="Conversions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border">
            <h3>Appels récents</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-muted-foreground">Société</th>
                  <th className="text-left p-4 text-muted-foreground">Contact</th>
                  <th className="text-left p-4 text-muted-foreground">Durée</th>
                  <th className="text-left p-4 text-muted-foreground">Statut</th>
                  <th className="text-left p-4 text-muted-foreground">Heure</th>
                </tr>
              </thead>
              <tbody>
                {recentCalls.map((call) => (
                  <tr key={call.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-foreground">{call.company}</td>
                    <td className="p-4 text-foreground">{call.contact}</td>
                    <td className="p-4 text-muted-foreground">{call.duration}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        call.status === 'Converti' ? 'bg-success/10 text-success' :
                        call.status === 'Refusé' ? 'bg-destructive/10 text-destructive' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{call.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
