import React, { useState, useEffect } from 'react';
import { 
  Phone, PhoneOff, Pause, Users, TrendingUp, Clock, AlertTriangle, 
  UserPlus, X, User, Key, Mail, Shield, CheckCircle, Loader2, Edit2, Trash2 
} from 'lucide-react';

import api from '../../services/api';

import { useChartTheme } from '../../hooks/useChartTheme';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';

// agentsStatus is now managed as state inside the component


const hourlyData = [
  { hour: '08:00', appels: 24, conversions: 15 },
  { hour: '09:00', appels: 48, conversions: 32 },
  { hour: '10:00', appels: 56, conversions: 38 },
  { hour: '11:00', appels: 52, conversions: 35 },
  { hour: '12:00', appels: 28, conversions: 18 },
  { hour: '13:00', appels: 32, conversions: 20 },
  { hour: '14:00', appels: 60, conversions: 42 }
];

const alerts = [
  { id: 1, agent: 'agent 1', type: 'inactivité', message: 'Pause prolongée (20 min)', time: '14:30' },
  { id: 2, agent: 'agent 2', type: 'absence', message: 'Hors ligne depuis 1h', time: '13:45' }
];

export default function AdminDashboard() {
  const chartTheme = useChartTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<any>(null); // For editing


  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const data = await api.getAgents();
      // Map database users to the format expected by the dashboard
      const formatted = data.map((u: any) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        status: u.role === 'admin' ? 'en-ligne' : ['en-appel', 'en-ligne', 'pause'][Math.floor(Math.random() * 3)],
        duration: ['05:12', '12:35', '00:00', '08:20'][Math.floor(Math.random() * 4)],
        calls: Math.floor(Math.random() * 50),
        conversions: Math.floor(Math.random() * 30),
        score: 70 + Math.floor(Math.random() * 30)
      }));
      setAgents(formatted);
    } catch (e) {
      console.error('Error loading agents:', e);
    }
  };

  const handleDelete = async (agent: any) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'agent ${agent.name} ?`)) return;
    try {
      await api.deleteUser(agent.id);
      setSuccessMsg(`Agent ${agent.name} supprimé avec succès.`);
      loadAgents();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la suppression');
    }
  };

  const openEditModal = (agent: any) => {
    setSelectedAgent(agent);
    setFormData({
      username: agent.username,
      password: '••••••••', // Placeholder
      name: agent.name,
      role: agents.find(a => a.id === agent.id)?.role || 'agent', // Need to check role
      email: agent.email || `${agent.username}@crm-ai.com`
    });
    setShowAddModal(true);
  };



  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'agent',
    email: ''
  });

  const enLigne = agents.filter(a => a.status !== 'hors-ligne').length;
  const enAppel = agents.filter(a => a.status === 'en-appel').length;
  const totalAppels = agents.reduce((sum, a) => sum + a.calls, 0);
  const totalConversions = agents.reduce((sum, a) => sum + a.conversions, 0);
  const tauxConversion = totalAppels > 0 ? ((totalConversions / totalAppels) * 100).toFixed(1) : "0";


  return (
    <>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-row-reverse items-center justify-end gap-6 w-full">
            <button 
              onClick={() => setShowAddModal(true)}
              className="md:flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl hover:scale-105 transition-all font-black uppercase italic tracking-tighter shadow-lg shadow-purple-600/20 text-xs"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter Agent
            </button>
            <div className="border-l-4 border-purple-500 pl-4">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">Dashboard <span className="text-purple-500">Live</span></h2>
              <p className="text-muted-foreground mt-1 text-[10px] font-bold uppercase tracking-widest opacity-70">Supervision en temps réel de l'activité</p>
            </div>
          </div>

        </div>

        {successMsg && (
          <div className="bg-emerald-500/10 border-2 border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <p className="text-emerald-500 font-bold text-sm">{successMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-gray-900 dark:text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold uppercase tracking-widest opacity-80">Agents en ligne</h3>
              <Users className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-4xl font-black italic tracking-tighter">{enLigne}/{agents.length}</p>

          </div>

          <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 text-gray-900 dark:text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold uppercase tracking-widest opacity-80">En appel</h3>
              <Phone className="w-5 h-5 opacity-80 animate-pulse" />
            </div>
            <p className="text-4xl font-black italic tracking-tighter">{enAppel}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-gray-900 dark:text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold uppercase tracking-widest opacity-80">Appels Jour</h3>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-4xl font-black italic tracking-tighter">{totalAppels}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-gray-900 dark:text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold uppercase tracking-widest opacity-80">Conversion</h3>
              <CheckCircle className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-4xl font-black italic tracking-tighter">{tauxConversion}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Volume horaire & conversion</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.gridColor} opacity={0.1} />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} stroke={chartTheme.textColor} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} stroke={chartTheme.textColor} />
                  <Tooltip 
                    contentStyle={chartTheme.tooltipStyle}
                  />
                  <Area type="monotone" dataKey="appels" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" />
                  <Area type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={3} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Expertise équipe</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                  { critere: 'Écoute', score: 85 },
                  { critere: 'Persuasion', score: 72 },
                  { critere: 'Empathie', score: 91 },
                  { critere: 'Vente', score: 68 },
                  { critere: 'Refus', score: 75 },
                  { critere: 'Clarté', score: 82 }
                ]}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="critere" tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                  <Radar name="Equipe" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20">
            <h3 className="text-xs font-black uppercase tracking-widest italic">Activité des agents</h3>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-black uppercase tracking-tighter opacity-50">Agent</th>
                <th className="text-left p-4 font-black uppercase tracking-tighter opacity-50">Statut</th>
                <th className="text-left p-4 font-black uppercase tracking-tighter opacity-50">Durée</th>
                <th className="text-left p-4 font-black uppercase tracking-tighter opacity-50">Score</th>
                <th className="text-right p-4 font-black uppercase tracking-tighter opacity-50">Actions</th>
              </tr>
            </thead>

            <tbody>
              {agents.map(agent => (

                <tr key={agent.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                  <td className="p-4 font-bold italic">{agent.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full font-black uppercase text-[9px] ${
                      agent.status === 'en-appel' ? 'bg-rose-500/10 text-rose-500' :
                      agent.status === 'en-ligne' ? 'bg-emerald-500/10 text-emerald-500' :
                      'bg-slate-500/10 text-slate-500'
                    }`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground font-mono">{agent.duration}</td>
                  <td className="p-4 text-primary font-black">{agent.score}%</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(agent)}
                        className="p-2 hover:bg-purple-500/10 rounded-xl transition-colors text-purple-500 group"
                      >
                        <Edit2 className="w-4 h-4 group-hover:scale-110" />
                      </button>
                      <button 
                        onClick={() => handleDelete(agent)}
                        className="p-2 hover:bg-rose-500/10 rounded-xl transition-colors text-rose-500 group"
                      >
                        <Trash2 className="w-4 h-4 group-hover:scale-110" />
                      </button>
                    </div>
                  </td>
                </tr>

              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL AJOUT AGENT */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-100 dark:bg-slate-800 dark:bg-slate-800/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-md rounded-3xl border-2 border-purple-500/20 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-border flex items-center justify-between bg-purple-500/5">
              <h3 className="text-xl font-black italic tracking-tighter text-foreground uppercase">
                {selectedAgent ? 'Modifier' : 'Nouvel'} <span className="text-purple-500">Agent</span>
              </h3>
              <button onClick={() => { setShowAddModal(false); setSelectedAgent(null); }} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setErrorMsg('');
              try {
                console.log("Envoi des données:", formData);
                if (selectedAgent) {
                  await api.updateUser(selectedAgent.id, formData);
                  setSuccessMsg(`Agent ${formData.name} mis à jour avec succès !`);
                } else {
                  await api.createUser(formData);
                  setSuccessMsg(`Agent ${formData.name} créé avec succès !`);
                }
                setShowAddModal(false);
                setSelectedAgent(null);
                setFormData({ username: '', password: '', name: '', role: 'agent', email: '' });
                loadAgents(); // Refresh the list
                setTimeout(() => setSuccessMsg(''), 5000);
              } catch (err: any) {
                console.error("Erreur CAPTURÉE:", err);
                setErrorMsg(err.message || 'Erreur inconnue');
              } finally {
                setLoading(false);
              }
            }} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-500 text-[11px] font-black uppercase tracking-widest leading-tight">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                  <input
                    type="text" required placeholder="Nom Complet"
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 text-slate-900 font-bold rounded-2xl border-none shadow-lg focus:ring-2 focus:ring-purple-500"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text" required placeholder="Pseudo / Login"
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 text-slate-900 font-bold rounded-2xl border-none shadow-lg focus:ring-2 focus:ring-purple-500"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                  />
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                    <input
                      type="password" required placeholder="Pass"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 text-slate-900 font-bold rounded-2xl border-none shadow-lg focus:ring-2 focus:ring-purple-500"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                  <input
                    type="email" required placeholder="Email professionnel"
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 text-slate-900 font-bold rounded-2xl border-none shadow-lg focus:ring-2 focus:ring-purple-500"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full px-4 py-3 bg-purple-600 text-white font-black uppercase italic tracking-tighter rounded-2xl shadow-xl shadow-purple-600/20 hover:scale-[1.05] transition-all disabled:opacity-50"
                >
                  {loading ? 'CHARGEMENT...' : (selectedAgent ? 'ENREGISTRER LES MODIFICATIONS' : 'VALIDER LA CRÉATION')}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
