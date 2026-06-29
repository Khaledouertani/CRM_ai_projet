import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Award, Target, MessageSquare, Calendar, ArrowUp, ArrowDown, Loader2, Search, Filter, ChevronDown, ChevronUp, Phone, Clock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { useChartTheme } from '../../hooks/useChartTheme';

const weeklyData = [
  { day: 'Lun', score: 78, appels: 45, conversions: 28 },
  { day: 'Mar', score: 82, appels: 52, conversions: 31 },
  { day: 'Mer', score: 85, appels: 48, conversions: 35 },
  { day: 'Jeu', score: 88, appels: 56, conversions: 38 },
  { day: 'Ven', score: 92, appels: 54, conversions: 40 }
];

const skillsData = [
  { skill: 'Écoute', value: 95 },
  { skill: 'Persuasion', value: 88 },
  { skill: 'Empathie', value: 92 },
  { skill: 'Argumentation', value: 85 },
  { skill: 'Gestion objections', value: 78 },
  { skill: 'Closing', value: 90 }
];

const suggestions = [
  { id: 1, type: 'success', title: 'Excellent travail sur l\'écoute active', description: 'Vos temps de silence et vos reformulations sont très bien maîtrisés.' },
  { id: 2, type: 'improvement', title: 'Améliorer la gestion des objections', description: 'Prenez plus de temps pour comprendre la vraie raison derrière l\'objection avant de répondre.' },
  { id: 3, type: 'tip', title: 'Astuce : Technique du silence', description: 'Après avoir posé une question importante, laissez un silence de 3-5 secondes pour que le client réfléchisse.' }
];

const callHistory = [
  { id: 1, date: '2026-04-01', time: '14:23', company: 'Société ABC', contact: 'Jean Dupont', duration: '5:32', result: 'Converti', score: 95, notes: 'Client très intéressé, bon feeling', aiSummary: 'Prospect qualifié avec un besoin immédiat. Budget confirmé. Décision rapide attendue.' },
  { id: 2, date: '2026-04-01', time: '14:10', company: 'Entreprise XYZ', contact: 'Marie Martin', duration: '3:15', result: 'Refusé', score: 72, notes: 'Pas de budget pour l\'instant', aiSummary: 'Budget insuffisant. Pas de besoin identifié à court terme.' },
  { id: 3, date: '2026-04-01', time: '13:55', company: 'Solutions Pro', contact: 'Pierre Leroy', duration: '8:45', result: 'Converti', score: 98, notes: 'Excellent contact, signature prévue', aiSummary: 'Décision positive. Excellent rapport. Signature imminente.' },
  { id: 4, date: '2026-04-01', time: '13:40', company: 'Tech Innovate', contact: 'Sophie Bernard', duration: '2:30', result: 'Rappel', score: 85, notes: 'Doit consulter son équipe', aiSummary: 'Intérêt confirmé. Validation interne nécessaire. Rappel à planifier dans 48h.' },
  { id: 5, date: '2026-04-01', time: '13:20', company: 'Digital Services', contact: 'Luc Moreau', duration: '6:12', result: 'Converti', score: 91, notes: 'Contrat signé pendant l\'appel', aiSummary: 'Conversion réussie. Excellent échange commercial. Client satisfait.' },
  { id: 6, date: '2026-03-31', time: '17:30', company: 'Startup Alpha', contact: 'Emma Dubois', duration: '4:18', result: 'Rappel', score: 78, notes: 'Intéressée mais occupe', aiSummary: 'Prospect prometteur. Occupée actuellement. Meilleur moment : matin.' },
  { id: 7, date: '2026-03-31', time: '16:45', company: 'Industries Beta', contact: 'Thomas Petit', duration: '7:20', result: 'Converti', score: 93, notes: 'Deal important, très satisfait', aiSummary: 'Gros contrat. Client enthousiaste. Recommandations possibles.' },
  { id: 8, date: '2026-03-31', time: '15:22', company: 'Commerce Gamma', contact: 'Julie Roux', duration: '1:45', result: 'Refusé', score: 65, notes: 'Mauvais timing', aiSummary: 'Contexte défavorable. Pas de besoin actuel. Ne pas recontacter.' }
];

type TabId = 'overview' | 'comparison' | 'skills' | 'history';

export default function PerformancePage() {
  const chartTheme = useChartTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<any>(null);

  // History tab state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState('all');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    loadComparison();
  }, []);

  const loadComparison = async () => {
    setLoading(true);
    try {
      const data = await api.getPerformanceComparison();
      setComparison(data);
    } catch (e) {
      setComparison({
        current_month: { total_calls: 142, avg_score: 78, conversions: 25, refusal_rate: 15, avg_duration: 225 },
        previous_month: { total_calls: 128, avg_score: 74, conversions: 23, refusal_rate: 18, avg_duration: 210 },
        evolution: { total_calls: 10.9, avg_score: 5.4, conversions: 8.7, refusal_rate: -16.7, avg_duration: 7.1 },
        monthly_data: [
          { month: 'Jan', calls: 98, score: 72, conversions: 15, refusals: 20 },
          { month: 'Fév', calls: 105, score: 74, conversions: 18, refusals: 18 },
          { month: 'Mar', calls: 112, score: 75, conversions: 20, refusals: 17 },
          { month: 'Avr', calls: 118, score: 76, conversions: 21, refusals: 16 },
          { month: 'Mai', calls: 125, score: 78, conversions: 22, refusals: 15 },
          { month: 'Juin', calls: 142, score: 78, conversions: 25, refusals: 15 }
        ],
        rendement_status: "diminué",
        mistakes: [
          "Votre score global a baissé de 2.5%.",
          "Plus d'incohérences de qualification ce mois-ci (3 erreurs)."
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m${secs}s`;
  };

  const getEvolutionClass = (value: number, inverse: boolean = false) => {
    if (inverse) value = -value;
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getEvolutionIcon = (value: number, inverse: boolean = false) => {
    if (inverse) value = -value;
    if (value > 0) return ArrowUp;
    if (value < 0) return ArrowDown;
    return null;
  };

  const tabs = [
    { id: 'overview' as TabId, label: 'Vue Globale' },
    { id: 'skills' as TabId, label: 'Compétences' },
    { id: 'history' as TabId, label: 'Historique' }
  ];

  const filteredCalls = callHistory.filter(call => {
    const matchesSearch = call.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         call.contact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterResult === 'all' || call.result === filterResult;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2>Ma Performance</h2>
          <p className="text-muted-foreground mt-1">Analyse détaillée de votre performance et suggestions d'amélioration</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: Overview */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-indigo-600/20 border-b-4 border-indigo-900/20 transform hover:scale-[1.05] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-xl backdrop-blur-md">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-white">Global</span>
                </div>
                <h3 className="text-sm font-black uppercase tracking-tighter opacity-80 italic text-white">Score Global</h3>
                <p className="text-4xl font-black italic tracking-tighter mt-1 text-white">92/100</p>
                <div className="flex items-center gap-1 mt-2 inline-flex items-center gap-1 bg-white/20 dark:bg-slate-900/20 px-2 py-1 rounded-full text-[10px] font-black uppercase text-white">
                  <TrendingUp className="w-3 h-3" /> +5 VS SEMAINE DERNIÈRE
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20 border-b-4 border-emerald-900/20 transform hover:scale-[1.05] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-xl backdrop-blur-md">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-white">Impact</span>
                </div>
                <h3 className="text-sm font-black uppercase tracking-tighter opacity-80 italic text-white">Taux conversion</h3>
                <p className="text-4xl font-black italic tracking-tighter mt-1 text-white">68.5%</p>
                <div className="flex items-center gap-1 mt-2 inline-flex items-center gap-1 bg-white/20 dark:bg-slate-900/20 px-2 py-1 rounded-full text-[10px] font-black uppercase text-white">
                  <TrendingUp className="w-3 h-3" /> +3.2%
                </div>
              </div>

              <div className="bg-gradient-to-br from-sky-500 to-sky-700 rounded-3xl p-6 text-white shadow-xl shadow-sky-500/20 border-b-4 border-sky-900/20 transform hover:scale-[1.05] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-xl backdrop-blur-md">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-white">Qualité</span>
                </div>
                <h3 className="text-sm font-black uppercase tracking-tighter opacity-80 italic text-white">Appels qualité</h3>
                <p className="text-4xl font-black italic tracking-tighter mt-1 text-white">87%</p>
                <div className="flex items-center gap-1 mt-2 inline-flex items-center gap-1 bg-white/20 dark:bg-slate-900/20 px-2 py-1 rounded-full text-[10px] font-black uppercase text-white">
                  <TrendingUp className="w-3 h-3" /> +1.5%
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-amber-500/20 border-b-4 border-amber-900/20 transform hover:scale-[1.05] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-xl backdrop-blur-md">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-white">Podium</span>
                </div>
                <h3 className="text-sm font-black uppercase tracking-tighter opacity-80 italic text-white">Classement</h3>
                <p className="text-4xl font-black italic tracking-tighter mt-1 text-white">3E</p>
                <p className="text-[10px] font-black uppercase mt-2 inline-flex items-center gap-1 bg-white/20 dark:bg-slate-900/20 px-2 py-1 rounded-full text-white">
                  SUR 24 AGENTS
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="mb-4">Évolution du score hebdomadaire</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#d946ef" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                    <XAxis dataKey="day" stroke={chartTheme.textColor} tick={{ fontSize: 11, fontWeight: 700, fill: chartTheme.textColor }} />
                    <YAxis stroke={chartTheme.textColor} tick={{ fontSize: 11, fontWeight: 700, fill: chartTheme.textColor }} />
                    <Tooltip contentStyle={chartTheme.tooltipStyle} />
                    <Legend iconType="circle" />
                    <Line type="monotone" dataKey="score" stroke="url(#colorScore)" strokeWidth={5} dot={{ fill: chartTheme.textColor, strokeWidth: 3, r: 6, stroke: '#6366f1' }} activeDot={{ r: 8, strokeWidth: 0 }} name="Score" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="mb-4">Feedback IA & Suggestions</h3>
                <div className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <div key={suggestion.id} className={`p-4 rounded-lg border ${
                      suggestion.type === 'success' ? 'bg-success/5 border-success/20' :
                      suggestion.type === 'improvement' ? 'bg-warning/5 border-warning/20' :
                      'bg-info/5 border-info/20'
                    }`}>
                      <h4 className={`font-medium mb-1 ${
                        suggestion.type === 'success' ? 'text-success' :
                        suggestion.type === 'improvement' ? 'text-warning' :
                        'text-info'
                      }`}>
                        {suggestion.title}
                      </h4>
                      <p className="text-sm text-foreground">{suggestion.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB: Comparison */}
        {activeTab === 'comparison' && comparison && (
          <>
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Ce mois vs Mois dernier
                </h3>
                <button onClick={loadComparison} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-2">Ce mois</p>
                  <p className="text-3xl font-bold">{comparison.current_month.total_calls}</p>
                  <p className="text-sm text-muted-foreground">appels</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-2">Mois dernier</p>
                  <p className="text-3xl font-bold">{comparison.previous_month.total_calls}</p>
                  <p className="text-sm text-muted-foreground">appels</p>
                </div>
                <div className={`bg-muted/30 rounded-xl p-4 ${getEvolutionClass(comparison.evolution.total_calls)}`}>
                  <p className="text-sm text-muted-foreground mb-2">Évolution</p>
                  <p className="text-3xl font-bold flex items-center gap-2">
                    {(() => {
                      const Icon = getEvolutionIcon(comparison.evolution.total_calls);
                      return Icon ? <Icon className="w-6 h-6" /> : null;
                    })()}
                    {comparison.evolution.total_calls > 0 ? '+' : ''}{comparison.evolution.total_calls.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {[
                  { label: 'Appels', key: 'total_calls', inverse: false },
                  { label: 'Score', key: 'avg_score', inverse: false },
                  { label: 'Conversions', key: 'conversions', inverse: false },
                  { label: 'Refus', key: 'refusal_rate', inverse: true },
                  { label: 'Durée', key: 'avg_duration', inverse: false }
                ].map((metric) => {
                  const value = comparison.evolution[metric.key as keyof typeof comparison.evolution] as number;
                  const EvolIcon = getEvolutionIcon(value, metric.inverse);
                  return (
                    <div key={metric.key} className="bg-muted/20 rounded-lg p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                      <p className={`text-xl font-bold flex items-center justify-center gap-1 ${getEvolutionClass(value, metric.inverse)}`}>
                        {EvolIcon && <EvolIcon className="w-4 h-4" />}
                        {value > 0 ? '+' : ''}{value.toFixed(1)}%
                      </p>
                    </div>
                  );
                })}
              </div>

              {comparison.mistakes && comparison.mistakes.length > 0 && (
                <div className={`mb-6 p-5 rounded-xl border ${comparison.rendement_status === 'diminué' ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                  <h4 className={`text-lg font-black uppercase italic tracking-tighter mb-2 flex items-center gap-2 ${comparison.rendement_status === 'diminué' ? 'text-red-500' : 'text-green-500'}`}>
                    {comparison.rendement_status === 'diminué' ? <TrendingDown className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                    Bilan : Rendement {comparison.rendement_status}
                  </h4>
                  <p className="text-sm text-foreground mb-3 font-medium">Analyse comparative (Éléments impactant la performance) :</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {comparison.mistakes.map((mistake: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className={`mt-1 min-w-2 min-h-2 rounded-full ${comparison.rendement_status === 'diminué' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-card rounded-lg border border-border p-6">
                <h4 className="mb-4">Historique (6 derniers mois)</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={comparison.monthly_data}>
                    <defs>
                      <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                    <XAxis dataKey="month" stroke={chartTheme.textColor} tick={{ fontSize: 11 }} />
                    <YAxis stroke={chartTheme.textColor} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={chartTheme.tooltipStyle} />
                    <Area type="monotone" dataKey="calls" stroke="#6366f1" strokeWidth={2} fill="url(#colorCalls)" name="Appels" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* TAB: Skills */}
        {activeTab === 'skills' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-3xl border-2 border-border p-6 shadow-2xl">
              <h3 className="text-lg font-black italic tracking-tighter uppercase mb-6 flex items-center gap-2">
                <div className="w-2 h-6 bg-primary rounded-full"></div>
                Compétences <span className="text-primary">évaluées</span>
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={skillsData}>
                  <PolarGrid stroke={chartTheme.gridColor} />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fontWeight: 900, fill: chartTheme.textColor }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: chartTheme.textColor, fontSize: 8 }} axisLine={false} />
                  <Radar name="Score" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} strokeWidth={4} />
                  <Tooltip contentStyle={chartTheme.tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="mb-4">Performance par jour</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                  <XAxis dataKey="day" stroke={chartTheme.textColor} tick={{ fontSize: 11, fontWeight: 700, fill: chartTheme.textColor }} />
                  <YAxis stroke={chartTheme.textColor} tick={{ fontSize: 11, fontWeight: 700, fill: chartTheme.textColor }} />
                  <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  <Legend iconType="circle" />
                  <Bar dataKey="appels" fill="#6366f1" radius={[4, 4, 0, 0]} name="Appels" />
                  <Bar dataKey="conversions" fill="#10b981" radius={[4, 4, 0, 0]} name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB: History */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-muted-foreground">Total appels</h3>
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-medium text-foreground">{callHistory.length}</p>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-muted-foreground">Durée moyenne</h3>
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <p className="text-3xl font-medium text-foreground">5:12</p>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-muted-foreground">Score moyen</h3>
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <p className="text-3xl font-medium text-foreground">84.6</p>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Rechercher par société ou contact..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground shadow-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-muted-foreground" />
                    <select
                      value={filterResult}
                      onChange={(e) => setFilterResult(e.target.value)}
                      className="px-3 py-2 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                    >
                      <option value="all">Tous les résultats</option>
                      <option value="Converti">Converti</option>
                      <option value="Rappel">Rappel</option>
                      <option value="Refusé">Refusé</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-muted-foreground">Date</th>
                      <th className="text-left p-4 text-muted-foreground">Société</th>
                      <th className="text-left p-4 text-muted-foreground">Contact</th>
                      <th className="text-left p-4 text-muted-foreground">Durée</th>
                      <th className="text-left p-4 text-muted-foreground">Résultat</th>
                      <th className="text-left p-4 text-muted-foreground">Score</th>
                      <th className="text-left p-4 text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCalls.map((call) => (
                      <React.Fragment key={call.id}>
                        <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="p-4 text-foreground">
                            <div>
                              <p className="font-medium">{call.date}</p>
                              <p className="text-sm text-muted-foreground">{call.time}</p>
                            </div>
                          </td>
                          <td className="p-4 text-foreground">{call.company}</td>
                          <td className="p-4 text-foreground">{call.contact}</td>
                          <td className="p-4 text-muted-foreground">{call.duration}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              call.result === 'Converti' ? 'bg-success/10 text-success' :
                              call.result === 'Refusé' ? 'bg-destructive/10 text-destructive' :
                              'bg-warning/10 text-warning'
                            }`}>
                              {call.result}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden min-w-[50px]">
                                <div
                                  className={`h-full ${
                                    call.score >= 90 ? 'bg-success' :
                                    call.score >= 75 ? 'bg-warning' :
                                    'bg-destructive'
                                  }`}
                                  style={{ width: `${call.score}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-foreground">{call.score}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => setExpandedRow(expandedRow === call.id ? null : call.id)}
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                              {expandedRow === call.id ? (
                                <ChevronUp className="w-4 h-4 text-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-foreground" />
                              )}
                            </button>
                          </td>
                        </tr>
                        {expandedRow === call.id && (
                          <tr className="bg-muted/20">
                            <td colSpan={7} className="p-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium text-foreground mb-2">Notes de l'agent</h4>
                                  <p className="text-sm text-muted-foreground">{call.notes}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium text-foreground mb-2">Résumé IA</h4>
                                  <p className="text-sm text-muted-foreground">{call.aiSummary}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}