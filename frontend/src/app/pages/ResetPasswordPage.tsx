import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { toast } from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      toast.error('Token manquant');
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      toast.error('Le mot de passe doit faire au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token!, password);
      toast.success('Mot de passe mis à jour !');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour');
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
      </div>

      <div className="w-full max-w-[500px] mx-auto flex flex-col justify-center relative z-10 p-6">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#2563EB] to-[#00D4FF] rounded-[40px] opacity-20 blur-xl group-hover:opacity-40 transition duration-1000" />
          
          <div className="relative bg-[#1E293B] border border-blue-500/20 rounded-[40px] shadow-2xl p-8 lg:p-12 overflow-hidden">
            <div className="relative z-10 mb-10">
              <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase mb-2">Nouveau <span className="text-[#00D4FF]">Accès</span></h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Définissez votre nouveau mot de passe</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">
                  Nouveau Mot de passe
                </Label>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-[#00D4FF] transition-colors" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-14 py-7 rounded-2xl bg-[#0F172A]/50 border border-blue-500/10 text-white placeholder:text-slate-600 focus-visible:ring-2 focus-visible:ring-[#00D4FF]/30 focus-visible:border-[#00D4FF]/50 transition-all text-sm font-medium"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#00D4FF] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">
                  Confirmer le mot de passe
                </Label>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-[#00D4FF] transition-colors" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-12 pr-14 py-7 rounded-2xl bg-[#0F172A]/50 border border-blue-500/10 text-white placeholder:text-slate-600 focus-visible:ring-2 focus-visible:ring-[#00D4FF]/30 focus-visible:border-[#00D4FF]/50 transition-all text-sm font-medium"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-gradient-to-r from-[#2563EB] to-[#00D4FF] text-white rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Valider le changement <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
