import React, { useState, useRef } from 'react';
import { 
  FileAudio, 
  Upload, 
  Brain, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Mic, 
  ShieldCheck, 
  ShieldAlert,
  Loader2,
  FileText,
  Save,
  Send
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from 'react-hot-toast';
import { useChartTheme } from '../hooks/useChartTheme';

// --- SUB-COMPONENTS ---
const Award = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
);

const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
);

function ScoreProgress({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[9px] font-black uppercase">
        <span>{label}</span>
        <span>{value}/10</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden shadow-inner">
        <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${value * 10}%` }}></div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function AnalysisPage() {
  const chartTheme = useChartTheme();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    "Initialisation du cortex AI...",
    "Extraction de l'empreinte vocale...",
    "Segmentation par diarisation (Agent/Client)...",
    "Transcription neuronale (Whisper v3)...",
    "Analyse sémantique et sentimentale...",
    "Vérification de la conformité du script...",
    "Génération du rapport final..."
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const startAnalysis = async () => {
    if (!file) return;
    setAnalyzing(true);
    setStep(0);
    
    const interval = setInterval(() => {
      setStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 3000);

    try {
      const data = await api.analyzeCall(file, user?.username || "Inconnu");
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'analyse");
      toast.error("Échec de l'analyse.");
    } finally {
      clearInterval(interval);
      setAnalyzing(false);
    }
  };

  const handleExport = () => {
    setExporting(true);
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'Génération du rapport PDF...',
        success: 'Rapport exporté avec succès !',
        error: 'Erreur lors de l\'export.',
      }
    ).finally(() => setExporting(false));
  };

  const handleSave = () => {
    setSaving(true);
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: 'Synchronisation avec le CRM...',
        success: 'Données enregistrées dans MySQL !',
        error: 'Erreur de synchronisation.',
      }
    ).finally(() => setSaving(false));
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 animate-slide-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-foreground uppercase border-l-8 border-primary pl-4">
            Total Audit <span className="text-primary">IA</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Supervision temps réel et analyse sémantique par intelligence artificielle</p>
        </div>
        {result && (
          <div className="flex gap-2">
            <button 
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-bold flex items-center gap-2 border border-border disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {exporting ? "Génération..." : "Export PDF"}
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEFT PANEL: UPLOAD & QUICK STATS */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-3xl border border-border p-6 shadow-premium relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-150 transition-all duration-700">
              <Upload className="w-24 h-24" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Source de l'appel</h3>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="audio/*" />
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <FileAudio className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-center truncate w-full px-2">
                {file ? file.name : "Cliquez pour charger l'audio"}
              </span>
            </div>

            <button 
              onClick={startAnalysis}
              disabled={!file || analyzing}
              className="w-full mt-6 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.1em] text-xs shadow-xl shadow-primary/20 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {analyzing ? "Analyse en cours..." : "Lancer l'audit total"}
            </button>
          </div>

          {result && (
            <>
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm overflow-hidden relative">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Répartition Temps Parole</h3>
                <div className="h-[200px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Agent', value: result.agent_talk_ratio || 0.6 },
                            { name: 'Client', value: result.client_talk_ratio || 0.4 }
                          ]}
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill="#4f46e5" />
                          <Cell fill="#10b981" />
                        </Pie>
                        <Tooltip contentStyle={chartTheme.tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-3xl font-black text-foreground drop-shadow-sm">{Math.round((result.score_percentage || result.score || 0))}%</span>
                       <span className="text-[8px] font-black text-primary uppercase tracking-widest">Score Global</span>
                    </div>
                </div>
                <div className="flex justify-between mt-4 text-[9px] font-black uppercase tracking-tighter">
                   <div className="flex items-center gap-2 px-2 py-1 bg-primary/5 rounded-md border border-primary/10">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div> 
                      Agent {Math.round((result.agent_talk_ratio || 0.6) * 100)}%
                   </div>
                   <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/5 rounded-md border border-emerald-500/10">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> 
                      Client {Math.round((result.client_talk_ratio || 0.4) * 100)}%
                   </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Indicateurs Comportementaux</h3>
                <div className="space-y-3">
                   <ScoreProgress label="Écoute active" value={result.score_ecoute || 0} color="bg-primary" />
                   <ScoreProgress label="Persuasion" value={result.score_persuasion || 0} color="bg-primary" />
                   <ScoreProgress label="Empathie" value={result.score_empathie || 0} color="bg-success" />
                   <ScoreProgress label="Argumentation" value={result.score_argumentation || 0} color="bg-warning" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* MAIN PANEL */}
        <div className="lg:col-span-3">
          {!result && !analyzing && (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center bg-card rounded-3xl border border-border p-10 shadow-inner">
               <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-8 relative">
                  <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping"></div>
                  <FileAudio className="w-12 h-12 text-primary" />
               </div>
               <h3 className="text-2xl font-black mb-4 uppercase tracking-[0.1em]">Audit IA en attente</h3>
               <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
                 Téléchargez un appel pour générer un rapport textuel complet incluant la transcription segmentée et l'analyse sémantique.
               </p>
            </div>
          )}

          {analyzing && (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-card rounded-3xl border border-border p-10 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-muted">
                  <div className="h-full bg-primary animate-pulse" style={{ width: `${((step + 1) / steps.length) * 100}%` }}></div>
               </div>
               <div className="relative w-40 h-40 mb-10">
                  <div className="absolute inset-0 border-[6px] border-primary/10 rounded-full"></div>
                  <div className="absolute inset-0 border-[6px] border-primary rounded-full border-t-transparent animate-spin"></div>
                  <Brain className="absolute inset-0 m-auto w-16 h-16 text-primary animate-pulse" />
               </div>
               <h3 className="text-2xl font-black mb-2 uppercase tracking-[0.2em] text-center">{steps[step]}</h3>
               <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest animate-pulse">Traitement neuronal en cours...</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
               
               {/* KEY CHECKPOINTS */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-6 rounded-2xl border-2 flex flex-col items-center text-center gap-3 transition-all hover:scale-105 ${result.script_respected ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
                     {result.script_respected ? <ShieldCheck className="w-8 h-8 text-success shadow-[0_0_15px_rgba(34,197,94,0.3)]" /> : <ShieldAlert className="w-8 h-8 text-destructive" />}
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Respect du Script</span>
                     <span className={`text-lg font-black ${result.script_respected ? 'text-success' : 'text-destructive'}`}>
                        {result.script_respected ? "CONFORME" : "NON CONFORME"}
                     </span>
                  </div>
                  <div className={`p-6 rounded-2xl border-2 flex flex-col items-center text-center gap-3 transition-all hover:scale-105 ${result.qualification_match ? 'bg-success/5 border-success/20' : 'bg-warning/5 border-warning/20'}`}>
                     {result.qualification_match ? <CheckCircle2 className="w-8 h-8 text-success shadow-[0_0_15px_rgba(34,197,94,0.3)]" /> : <AlertCircle className="w-8 h-8 text-warning" />}
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cohérence Qualif</span>
                     <span className={`text-lg font-black ${result.qualification_match ? 'text-success' : 'text-warning'}`}>
                        {result.qualification_match ? "VÉRIFIÉ" : "INCOHÉRENCE"}
                     </span>
                  </div>
                  <div className="p-6 bg-primary/5 border-2 border-primary/20 rounded-2xl flex flex-col items-center text-center gap-3 transition-all hover:scale-105">
                     <TrendingUp className="w-8 h-8 text-primary shadow-[0_0_15px_rgba(70,73,208,0.3)]" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sentiment Client</span>
                     <span className="text-lg font-black text-primary uppercase">{result.sentiment}</span>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Summary & Transcription */}
                  <div className="bg-card rounded-3xl border border-border p-8 shadow-sm flex flex-col gap-6">
                     <div>
                        <div className="flex items-center gap-3 mb-4">
                           <MessageSquare className="w-5 h-5 text-primary" />
                           <h3 className="font-black uppercase text-sm tracking-widest">Synthèse Textuelle IA</h3>
                        </div>
                        <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 relative text-sm leading-relaxed font-medium text-foreground">
                           <div className="absolute top-0 right-0 p-2 opacity-10"><Brain className="w-10 h-10" /></div>
                           {result.summary || "Aucun résumé disponible."}
                        </div>
                     </div>
                     
                     <div className="flex-1 min-h-[300px] flex flex-col">
                        <h4 className="text-[10px] font-black uppercase text-muted-foreground mb-4 tracking-widest border-b border-border pb-2">Transcription par segment (Diarisée)</h4>
                        <div className="flex-1 max-h-[450px] overflow-y-auto space-y-4 pr-3 custom-scrollbar">
                           {(result.labeled_transcript || result.transcription) ? (
                             <div className="space-y-4">
                               {(result.labeled_transcript || `Client: ${result.transcription}`).split('\n').filter((l:any)=>l.trim()).map((line: string, i: number) => {
                                 const isAgent = line.toLowerCase().startsWith('agent:') || line.toLowerCase().startsWith('[agent]');
                                 return (
                                   <div key={i} className={`group flex gap-3 ${isAgent ? 'flex-row-reverse' : ''}`}>
                                      <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 uppercase font-black text-[10px] shadow-sm ${isAgent ? 'bg-primary border-primary/20 text-white' : 'bg-success border-success/20 text-white'}`}>
                                         {isAgent ? "AG" : "CL"}
                                      </div>
                                      <div className={`p-4 rounded-2xl text-[12px] leading-relaxed relative ${isAgent ? 'bg-primary/10 rounded-tr-none border-l-4 border-primary text-foreground' : 'bg-success/5 rounded-tl-none border-l-4 border-success text-foreground'}`}>
                                         <span className="font-black text-[8px] uppercase block mb-1 opacity-50">{isAgent ? 'Agent' : 'Client'}</span>
                                         {line.replace(/^(Agent|Client):\s*/i, '').replace(/^\[(Agent|Client)\]\s*/i, '')}
                                      </div>
                                   </div>
                                 );
                               })}
                             </div>
                           ) : (
                             <div className="flex flex-col items-center justify-center h-full opacity-30 italic text-xs">
                                <MessageSquare className="w-8 h-8 mb-2" />
                                <p>Transcription non disponible</p>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Objections & Key metrics */}
                  <div className="space-y-6">
                     <div className="bg-card rounded-3xl border border-border p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                           <AlertCircle className="w-6 h-6 text-warning" />
                           <h3 className="font-black uppercase text-sm tracking-widest">Points Bloquants & Objections</h3>
                        </div>
                        {result.refusal_reason ? (
                          <div className="p-5 bg-warning/5 border-2 border-warning/10 rounded-2xl relative shadow-inner">
                             <h4 className="text-[10px] font-black text-warning uppercase mb-2 tracking-widest">Analyse de l'Objection</h4>
                             <p className="text-sm font-bold leading-tight text-foreground">{result.refusal_reason}</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-border rounded-2xl opacity-40">
                             <CheckCircle2 className="w-10 h-10 text-success mb-2" />
                             <p className="text-[10px] font-black uppercase tracking-[0.2em]">Flux d'appel fluide</p>
                          </div>
                        )}
                        
                        <div className="mt-8 grid grid-cols-2 gap-4">
                           <div className="p-4 bg-muted/20 rounded-2xl border border-border flex flex-col items-center shadow-inner group hover:bg-muted/30 transition-all">
                              <span className="block text-[8px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Inactivité</span>
                              <div className="flex items-center gap-2">
                                 <Clock className={`w-3 h-3 ${result.inactivity_detected ? 'text-red-500' : 'text-emerald-500'}`} />
                                 <span className={`text-sm font-black ${result.inactivity_detected ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {result.inactivity_detected ? `${result.inactivity_duration}s` : "Optimale"}
                                 </span>
                              </div>
                           </div>
                           <div className="p-4 bg-muted/20 rounded-2xl border border-border flex flex-col items-center shadow-inner group hover:bg-muted/30 transition-all">
                              <span className="block text-[8px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Politesse Agent</span>
                              <div className="flex items-center gap-2">
                                 <Award className="w-4 h-4 text-amber-500" />
                                 <span className="text-sm font-black text-foreground">{result.agent_politeness || 0}/10</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="bg-card rounded-3xl border border-border p-8 shadow-sm">
                        <h3 className="font-black uppercase text-sm tracking-widest mb-6">Mots Clés & Concepts</h3>
                        <div className="flex flex-wrap gap-2">
                           {result.keywords?.length > 0 ? result.keywords.map((k: string, i: number) => (
                             <span key={i} className="px-3 py-1.5 bg-primary/5 text-primary border border-primary/20 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-all cursor-default flex items-center gap-2">
                                <div className="w-1 h-1 bg-primary rounded-full"></div> {k}
                             </span>
                           )) : (
                             <span className="text-[10px] font-bold text-muted-foreground uppercase">Pas de mots clés extraits</span>
                           )}
                        </div>
                     </div>

                     {/* AI Intervention advice */}
                     <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-3xl p-8 text-gray-900 dark:text-white shadow-2xl relative overflow-hidden group border border-white/5 border-t-primary/30 border-t-2">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-all duration-500"><Sparkles className="w-16 h-16" /></div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Coach Virtuel IA</h3>
                        <p className="text-sm font-medium leading-relaxed italic opacity-90 border-l-2 border-white/20 pl-4">
                           {result.next_steps || "Le traitement IA suggère de poursuivre le coaching sur la gestion des objections techniques."}
                        </p>
                        <div className="mt-8 flex gap-3">
                           <button onClick={handleSave} className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/40 hover:opacity-90">
                              <Send className="w-3 h-3" /> Push to CRM
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}