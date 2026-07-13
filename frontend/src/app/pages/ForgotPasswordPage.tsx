import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Sparkles, Brain, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await forgotPassword(email);
      setSubmitted(true);
      toast.success('Email de réinitialisation envoyé !');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'envoi');
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
            <button 
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 text-slate-400 hover:text-[#00D4FF] transition-colors text-[10px] font-black uppercase tracking-widest mb-8"
            >
              <ArrowLeft className="w-4 h-4" /> Retour à la connexion
            </button>

            <div className="relative z-10 mb-10">
              <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase mb-2">Récupération</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Entrez votre email pour recevoir un lien</p>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">
                    Adresse Email
                  </Label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-[#00D4FF] transition-colors" />
                    <Input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 py-7 rounded-2xl bg-[#0F172A]/50 border border-blue-500/10 text-white placeholder:text-slate-600 focus-visible:ring-2 focus-visible:ring-[#00D4FF]/30 focus-visible:border-[#00D4FF]/50 transition-all text-sm font-medium"
                      placeholder="votre@email.com"
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
                      Envoyer le lien <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-10 h-10 text-[#00D4FF]" />
                </div>
                <h3 className="text-xl font-bold text-white">Email envoyé !</h3>
                <p className="text-slate-400 text-sm">
                  Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.
                </p>
                <Button 
                  onClick={() => navigate('/login')}
                  variant="outline" 
                  className="mt-6 border-blue-500/20 text-slate-300 hover:bg-blue-500/10"
                >
                  Retourner au Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
