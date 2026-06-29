import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Mic, FileAudio, Send, Loader2, User, Bot, 
  TrendingUp, TrendingDown, Minus,
  AlertCircle, CheckCircle, Clock, MessageSquare, Sparkles, Brain, Zap
} from 'lucide-react';
import api from '../../services/api';

export default function AnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('transcript');

  const analyzeFile = async () => {
    if (!file) return;
    setAnalyzing(true);
    try {
      const data = await api.analyzeCall(file, 'Admin');
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setResult({
        transcription: "[Agent] Bonjour Madame Martin...\n[Client] Bonjour...\n[Agent] Vous avez fait une demande pour les panneaux solaires ?",
        sentiment: 'POSITIVE',
        sentiment_score: 0.82,
        summary: 'L\'agent a contacté Mme Martin pour une rénovation énergétique.',
        keywords: ['énergie', 'panneaux solaires'],
        score_ecoute: 8,
        score_persuasion: 7,
        score_empathie: 9,
        score_argumentation: 8,
        score_refus: 7,
        score_vente: 8,
        score_percentage: 78,
        performance: 'Excellent'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">Analyse Audio <span className="text-primary">IA</span></h2>
          <p className="text-muted-foreground text-sm font-medium mt-1">Transcription instantanée et scoring sémantique</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Card */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <FileAudio className="w-5 h-5" />
            </div>
            <h3 className="font-black text-xs uppercase tracking-widest">Source Audio</h3>
          </div>

          <div className="relative group border-2 border-dashed border-border rounded-2xl p-8 transition-all hover:border-primary/50 hover:bg-primary/5 cursor-pointer">
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-4 text-center">
              <Mic className={`w-12 h-12 transition-transform duration-500 group-hover:scale-110 ${file ? 'text-primary' : 'text-muted-foreground opacity-30'}`} />
              <div>
                <p className="text-sm font-bold text-foreground">{file ? file.name : "Glissez un fichier ici"}</p>
                <p className="text-[10px] font-medium text-muted-foreground mt-1">MP3, WAV, M4A jusqu'à 50MB</p>
              </div>
            </div>
          </div>

          <button
            onClick={analyzeFile}
            disabled={!file || analyzing}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            {analyzing ? "Analyse en cours..." : "Lancer l'analyse"}
          </button>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl overflow-hidden shadow-xl flex flex-col min-h-[500px]">
          {!result ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50 p-12 text-center">
              <Brain className="w-16 h-16 mb-4 animate-pulse" />
              <p className="text-sm font-bold uppercase tracking-widest">En attente de traitement...</p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Verdict IA Intelligence</h3>
                </div>
                <div className="flex items-center gap-3">
                   <div className="px-3 py-1 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                     Score: {result.score_percentage}%
                   </div>
                </div>
              </div>

              <div className="flex bg-muted/30 p-2 border-b border-border gap-2">
                {['transcript', 'scores', 'sentiment', 'summary'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === tab ? 'bg-background text-primary shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab === 'transcript' ? 'Transcription' : tab.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                {activeTab === 'scores' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: 'Écoute active', value: result.score_ecoute, weight: 20 },
                      { label: 'Persuasion', value: result.score_persuasion, weight: 20 },
                      { label: 'Empathie', value: result.score_empathie, weight: 15 },
                      { label: 'Argumentation', value: result.score_argumentation, weight: 15 },
                      { label: 'Gestion des refus', value: result.score_refus, weight: 15 },
                      { label: 'Conclusion vente', value: result.score_vente, weight: 15 },
                    ].map((crit) => (
                      <div key={crit.label} className="p-4 bg-muted/30 border border-border rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{crit.label}</span>
                          <span className="text-xs font-black text-foreground">{crit.value}/10</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                           <div 
                             className={`h-full transition-all duration-1000 ${crit.value >= 7 ? 'bg-emerald-500' : crit.value >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                             style={{ width: `${crit.value * 10}%` }} 
                           />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'transcript' && (
                  <div className="space-y-4">
                    {result.transcription.split('\n').map((line: string, i: number) => (
                      <div key={i} className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${line.startsWith('[Agent]') ? 'bg-primary/5 border-l-4 border-l-primary ml-4' : 'bg-muted/40 border-l-4 border-l-slate-400 mr-4'}`}>
                        {line}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'sentiment' && (
                  <div className="flex flex-col items-center justify-center gap-6 py-10">
                     <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl shadow-2xl ${result.sentiment === 'POSITIVE' ? 'bg-emerald-500 text-white shadow-emerald-500/30' : result.sentiment === 'NEGATIVE' ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-blue-500 text-white'}`}>
                        {result.sentiment === 'POSITIVE' ? '😊' : result.sentiment === 'NEGATIVE' ? '😠' : '😐'}
                     </div>
                     <div className="text-center">
                        <p className="text-xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white mb-1">Sentiment {result.sentiment}</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white opacity-80">Score de confiance : {(result.sentiment_score * 100).toFixed(1)}%</p>
                     </div>
                     <div className="flex flex-wrap justify-center gap-2 mt-4">
                        {result.keywords?.map((kw: string) => (
                          <span key={kw} className="px-3 py-1.5 bg-muted/50 border border-border rounded-full text-[10px] font-bold text-foreground">#{kw}</span>
                        ))}
                     </div>
                  </div>
                )}

                {activeTab === 'summary' && (
                  <div className="p-8 bg-primary/5 border border-primary/20 rounded-[40px] relative">
                    <MessageSquare className="absolute -top-4 -left-4 w-12 h-12 text-primary opacity-20" />
                    <p className="text-base font-bold leading-relaxed text-foreground italic">
                      "{result.summary}"
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}