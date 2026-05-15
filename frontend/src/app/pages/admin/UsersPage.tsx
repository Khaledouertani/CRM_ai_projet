import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Trash2, Edit2, Loader2, Mail, 
  Briefcase, X, CheckCircle, AlertCircle, Key, User, ShieldCheck
} from 'lucide-react';
import api from '../../services/api';

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Create User Form State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'agent',
    email: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAgents();
      setUsers(data);
    } catch (e) {
      console.error('Error loading users:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.createUser(formData);
      setSuccessMsg(`L'utilisateur ${formData.name} a été créé avec succès !`);
      setShowModal(false);
      setFormData({ username: '', password: '', name: '', role: 'agent', email: '' });
      loadUsers();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la création');
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <Users className="w-5 h-5 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <span className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Synchronisation des accès...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-primary pl-6">
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl hover:opacity-90 transition-all font-black uppercase italic tracking-tighter shadow-lg shadow-primary/20"
        >
          <UserPlus className="w-5 h-5" />
          Nouvel Agent
        </button>
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Gestion des <span className="text-primary">Accès</span>
          </h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 opacity-70">
            Administration des comptes et permissions du système
          </p>
        </div>

      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16 text-primary" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{users.filter(u => u.role === 'agent').length}</p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Agents Actifs</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-2xl border border-border relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck className="w-16 h-16 text-emerald-500" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{users.filter(u => u.role === 'qualite').length}</p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Équipe Qualité</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Shield className="w-16 h-16 text-purple-500" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <Shield className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{users.filter(u => u.role === 'admin').length}</p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Administrateurs</p>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border-2 border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <p className="text-emerald-500 font-bold">{successMsg}</p>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-left p-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Utilisateur</th>
              <th className="text-left p-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">E-mail / Login</th>
              <th className="text-left p-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Rôle</th>
              <th className="text-right p-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i} className="border-b border-border hover:bg-muted/10 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center font-black text-primary text-sm uppercase border border-primary/20">
                      {u.name.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-foreground italic">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground font-bold italic">@{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">
                  <div className="flex items-center gap-2 font-medium">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    {u.email || `${u.username}@crm-ai.com`}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    u.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 
                    u.role === 'qualite' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  }`}>
                    {u.role === 'admin' ? '🔒 Admin' : u.role === 'qualite' ? '🛡️ Qualité' : '🎧 Agent'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground group">
                      <Edit2 className="w-4 h-4 group-hover:text-primary" />
                    </button>
                    <button className="p-2 hover:bg-red-500/10 rounded-xl transition-colors text-red-500 group">
                      <Trash2 className="w-4 h-4 group-hover:scale-110" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE USER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-md rounded-3xl border-2 border-primary/20 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-6 border-b border-border flex items-center justify-between bg-primary/5">
              <h3 className="text-xl font-black italic tracking-tighter text-foreground uppercase">
                Nouvel <span className="text-primary">Agent</span>
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
                type="button"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest">
                  <AlertCircle className="w-4 h-4" />
                  {errorMsg}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">Nom Complet</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Ahmed Mansour"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 text-slate-900 font-bold rounded-2xl border-none focus:ring-2 focus:ring-primary shadow-lg"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">Login / Username</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: ahmed.m"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 text-slate-900 font-bold rounded-2xl border-none focus:ring-2 focus:ring-primary shadow-lg"
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">Mot de Passe</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 text-slate-900 font-bold rounded-2xl border-none focus:ring-2 focus:ring-primary shadow-lg"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">E-mail Professionnel</label>
                  <input
                    type="email"
                    required
                    placeholder="agent@votre-crm.com"
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 text-slate-900 font-bold rounded-2xl border-none focus:ring-2 focus:ring-primary shadow-lg"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">Rôle Système</label>
                  <select
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 text-slate-900 font-black uppercase italic tracking-widest rounded-2xl border-none focus:ring-2 focus:ring-primary shadow-lg cursor-pointer"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="agent">👨‍💼 Agent Commercial</option>
                    <option value="qualite">🛡️ Service Qualité</option>
                    <option value="admin">🔒 Administrateur</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-muted text-foreground font-black uppercase italic tracking-tighter rounded-2xl border border-border hover:bg-muted/80 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary text-white font-black uppercase italic tracking-tighter rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  Créer Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
