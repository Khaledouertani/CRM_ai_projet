import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, TrendingUp, Users, BarChart3, Sparkles, Shield, Zap, ChevronRight, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      toast.success('Connexion réussie !');
      navigate('/');
    } catch (err: any) {
      const msg = err.message || 'Identifiants incorrects';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0F172A] relative overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/15 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-purple-600/10 rounded-full blur-[100px]" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] opacity-20" />
      </div>

      <div className="w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row relative z-10 p-6 lg:p-12 items-center gap-16">
        
        {/* Left Side: Brand & Stats */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8 animate-in slide-in-from-left duration-700">
            <Sparkles className="w-4 h-4 text-[#00D4FF]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00D4FF]">Plateforme CRM IA de Nouvelle Génération</span>
          </div>
          
          <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#2563EB] to-[#00D4FF] rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(0,212,255,0.4)] transform hover:rotate-6 transition-transform duration-500">
              <Brain className="w-10 h-10 text-gray-900 dark:text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-7xl font-black italic tracking-tighter text-gray-900 dark:text-white leading-none uppercase">
                AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#00D4FF]">CRM</span>
              </h1>
              <p className="text-xs font-black uppercase tracking-widest text-blue-400 opacity-60">Intelligence & Performance</p>
            </div>
          </div>

          <p className="text-xl text-blue-100/70 max-w-xl leading-relaxed mb-12 font-medium">
            Propulsez vos ventes dans le futur. Une gestion client intuitive, automatisée et ultra-performante.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Users, value: '500+', label: 'Clients', color: 'text-blue-400' },
              { icon: TrendingUp, value: '85%', label: 'Conversion', color: 'text-emerald-400' },
              { icon: BarChart3, value: '12M', label: 'Data Points', color: 'text-purple-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-slate-900/5 border border-white/10 rounded-3xl p-6 hover:bg-white dark:bg-slate-900/10 transition-colors group cursor-default">
                <stat.icon className={`w-8 h-8 ${stat.color} mb-3 group-hover:scale-110 transition-transform`} />
                <p className="text-2xl font-black text-gray-900 dark:text-white italic tracking-tighter">{stat.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 opacity-40">
            <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><Shield className="w-4 h-4" /> Sécurité Militaire</div>
            <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><Zap className="w-4 h-4" /> Temps Réel</div>
            <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><Sparkles className="w-4 h-4" /> IA Native</div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-[500px] animate-in slide-in-from-right duration-1000">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#2563EB] to-[#00D4FF] rounded-[40px] opacity-20 blur-xl group-hover:opacity-40 transition duration-1000" />
            
            <div className="relative bg-[#1E293B] border border-blue-500/20 rounded-[40px] shadow-2xl p-8 lg:p-12 overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Brain className="w-32 h-32 text-gray-900 dark:text-white" />
              </div>

              <div className="relative z-10 mb-10">
                <h2 className="text-3xl font-black italic tracking-tighter text-gray-900 dark:text-white uppercase mb-2">Connexion <span className="text-[#00D4FF]">Agent</span></h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Entrez vos accès pour piloter le système</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                {error && (
                  <div className="text-center animate-shake">
                    <p className="text-red-500 font-bold text-lg uppercase tracking-tight">Authentication error</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">
                    Identifiant / Email address
                  </Label>
                  <div className="relative group/input">
                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${error ? 'text-red-500' : 'text-slate-500 group-focus-within/input:text-[#00D4FF]'}`} />
                    <Input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`pl-12 py-7 rounded-2xl bg-[#0F172A]/50 text-gray-900 dark:text-white placeholder:text-slate-600 focus-visible:ring-2 transition-all text-sm font-medium ${
                        error 
                          ? 'border-red-500/50 focus-visible:ring-red-500/30 focus-visible:border-red-500' 
                          : 'border-blue-500/10 focus-visible:ring-[#00D4FF]/30 focus-visible:border-[#00D4FF]/50'
                      }`}
                      placeholder="Username / Email address"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">
                    Mot de passe
                  </Label>
                  <div className="relative group/input">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${error ? 'text-red-500' : 'text-slate-500 group-focus-within/input:text-[#00D4FF]'}`} />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`pl-12 pr-14 py-7 rounded-2xl bg-[#0F172A]/50 text-gray-900 dark:text-white placeholder:text-slate-600 focus-visible:ring-2 transition-all text-sm font-medium ${
                        error 
                          ? 'border-red-500/50 focus-visible:ring-red-500/30 focus-visible:border-red-500' 
                          : 'border-blue-500/10 focus-visible:ring-[#00D4FF]/30 focus-visible:border-[#00D4FF]/50'
                      }`}
                      placeholder="Password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-500' : 'text-slate-500 hover:text-[#00D4FF]'}`}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-center animate-in fade-in slide-in-from-top-2">
                    <p className="text-red-500 text-[11px] font-black uppercase tracking-widest bg-red-500/5 py-2 px-4 rounded-xl border border-red-500/10 inline-block">
                      ⚠️ {error}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="w-4 h-4 rounded border border-blue-500/30 bg-blue-500/10 group-hover:border-[#00D4FF] transition-colors" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">Rester connecté</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={() => navigate('/forgot-password')}
                    className="text-[10px] font-black text-blue-400 hover:text-[#00D4FF] transition-colors uppercase tracking-widest"
                  >
                    Lost password ?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-16 bg-gradient-to-r from-[#2563EB] to-[#00D4FF] text-gray-900 dark:text-white rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Lancer la session <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-10 text-center opacity-40">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Système de gestion crypté v2.4.0
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}