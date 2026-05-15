import React, { useState, useEffect } from 'react';
import { 
  Target, Users, Clock, Save, ShieldAlert, Sliders, 
  CheckCircle2, AlertTriangle, TrendingUp, Sparkles,
  Bell, History, Trash2, Zap, Brain, ArrowUpRight, TrendingDown
} from 'lucide-react';
import api from '../../services/api';

interface Weights {
  ecoute: number;
  persuasion: number;
  empathie: number;
  argumentation: number;
  refus: number;
  vente: number;
}

interface AlertConfig {
  min_score: number;
  max_inactivity_minutes: number;
  min_conversion_rate: number;
  alert_email: string;
  alert_enabled: boolean;
}

interface AgentScore {
  id: number;
  name: string;
  score: number;
  qualification: string;
}

interface AlertHistoryItem {
  id: number;
  agent_name: string;
  message: string;
  type: 'critical' | 'warning' | 'info';
  timestamp: string;
}

const criteriaLabels: Record<keyof Weights, string> = {
  ecoute: 'Écoute active',
  persuasion: 'Persuasion',
  empathie: 'Empathie',
  argumentation: 'Argumentation',
  refus: 'Gestion des refus',
  vente: 'Conclusion de la vente'
};

export default function ScoringPage() {
  const [weights, setWeights] = useState<Weights>({
    ecoute: 20,
    persuasion: 20,
    empathie: 15,
    argumentation: 15,
    refus: 15,
    vente: 15
  });

  const [alerts, setAlerts] = useState<AlertConfig>({
    min_score: 70,
    max_inactivity_minutes: 15,
    min_conversion_rate: 40,
    alert_email: 'admin@local',
    alert_enabled: true
  });

  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([]);
  const [totalWeight, setTotalWeight] = useState(100);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [agents, setAgents] = useState<AgentScore[]>([]);
  const [activeTab, setActiveTab] = useState('config'); // 'config' or 'history'

  useEffect(() => {
    setTotalWeight(Object.values(weights).reduce((a, b) => a + b, 0));
  }, [weights]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const agentData = await api.getAgentsPerformance();
      setAgents(agentData || []);
      
      // Mock history since API might be missing it
      setAlertHistory([
        { id: 1, agent_name: 'Ali M.', message: 'Score de persuasion critique (42%)', type: 'critical', timestamp: 'Il y a 5 min' },
        { id: 2, agent_name: 'Sana B.', message: 'Inactivité prolongée détectée (18 min)', type: 'warning', timestamp: 'Il y a 12 min' },
        { id: 3, agent_name: 'Omar K.', message: 'Performance exceptionnelle (98%)', type: 'info', timestamp: 'Il y a 45 min' },
        { id: 4, agent_name: 'Mariam Z.', message: 'Rupture de script détectée', type: 'warning', timestamp: 'Il y a 1h' },
      ]);
    } catch {
      setAgents([
        { id: 1, name: 'Sana B.', score: 92, qualification: 'RDV Client Confirmé' },
        { id: 2, name: 'Ali M.', score: 88, qualification: 'RDV Client Confirmé' },
        { id: 3, name: 'Omar K.', score: 75, qualification: 'Refus - Argumenté' }
      ]);
    }
  };

  const handleSave = async () => {
    if (totalWeight !== 100) {
      setSaveMsg('La somme doit être exactement 100%');
      return;
    }
    setSaving(true);
    setSaveMsg('');
    try {
      await api.saveWeights(weights);
      await api.saveConfig({ alerts }); // Assuming a generic saveConfig for alerts
      setSaveMsg('Paramètres IA & Alertes sauvegardés !');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  return (
    <div className="space-y-6">
      {/* Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black italic tracking-tighter uppercase">Inspection <span className="text-primary">IA</span></h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Analyse approfondie de l'anomalie</p>
                  </div>
               </div>
               <button onClick={() => setSelectedAlert(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                  <Trash2 className="w-5 h-5 text-muted-foreground hover:text-red-500" />
               </button>
            </div>
            <div className="p-8 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 border border-border rounded-2xl">
                     <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Agent</p>
                     <p className="font-bold text-foreground">{selectedAlert.agent_name}</p>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border rounded-2xl">
                     <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Type d'alerte</p>
                     <p className="font-bold text-red-500 uppercase">{selectedAlert.type}</p>
                  </div>
               </div>
               <div className="space-y-3">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Transcription & Analyse</p>
                  <div className="p-5 bg-muted/50 border border-border rounded-2xl max-h-[200px] overflow-y-auto custom-scrollbar">
                     <p className="text-sm font-medium leading-relaxed italic text-foreground opacity-80">
                       "[Agent] Bonjour, est-ce que vous seriez intéressé par... [Client] Pas vraiment. [Agent] Ah... bon... ok... [Silence prolongé]"
                     </p>
                  </div>
               </div>
               <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2 text-emerald-500">
                     <Brain className="w-4 h-4" />
                     <p className="text-[10px] font-black uppercase tracking-widest">Verdict IA</p>
                  </div>
                  <p className="text-xs font-medium text-foreground leading-relaxed">
                    Manque de répartie face à l'objection prix. L'agent n'a pas utilisé l'argumentation "Coup de pouce" configurée dans les scripts. Formation recommandée sur le module 'Objections'.
                  </p>
               </div>
            </div>
            <div className="p-6 bg-muted/20 border-t border-border flex justify-end gap-3">
               <button onClick={() => setSelectedAlert(null)} className="px-6 py-2.5 bg-card border border-border text-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all">Fermer</button>
               <button className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all">Contacter l'agent</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Alertes & <span className="text-primary">Scoring</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Configuration des seuils IA et monitoring des anomalies</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setActiveTab(activeTab === 'config' ? 'history' : 'config')}
             className="px-4 py-2.5 bg-card border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all flex items-center gap-2"
           >
             {activeTab === 'config' ? <History className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
             {activeTab === 'config' ? 'Historique' : 'Configuration'}
           </button>
           <button 
             onClick={handleSave} 
             disabled={saving || totalWeight !== 100}
             className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
           >
             <Save className="w-4 h-4" />
             {saving ? 'Synchronisation...' : 'Enregistrer'}
           </button>
        </div>
      </div>

      {saveMsg && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${saveMsg.includes('Erreur') ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
          <ShieldAlert className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">{saveMsg}</span>
        </div>
      )}

      {activeTab === 'config' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Criteria Weights */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Sliders className="w-4 h-4 text-primary" />
                   <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Pondération du Scoring IA</h3>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black ${totalWeight === 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500 animate-pulse'}`}>
                   TOTAL: {totalWeight}%
                </div>
              </div>
              <div className="p-6 space-y-6">
                {(Object.keys(weights) as Array<keyof Weights>).map(key => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="text-muted-foreground">{criteriaLabels[key]}</span>
                       <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={weights[key]}
                            onChange={e => setWeights(p => ({ ...p, [key]: +e.target.value }))}
                            className="w-14 px-2 py-1 bg-muted/40 border border-border rounded-lg text-center font-black text-slate-900"
                          />
                          <span className="text-muted-foreground">%</span>
                       </div>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                       <div className="h-full bg-primary transition-all duration-700" style={{ width: `${weights[key]}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts Threshold */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border bg-muted/20 flex items-center gap-2">
                   <Bell className="w-4 h-4 text-orange-400" />
                   <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Seuils Critiques d'Alertes</h3>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { label: 'Score Minimum (%)', icon: Target, key: 'min_score', color: 'text-primary' },
                    { label: 'Inactivité Max (min)', icon: Clock, key: 'max_inactivity_minutes', color: 'text-blue-400' },
                    { label: 'Conversion Min (%)', icon: TrendingUp, key: 'min_conversion_rate', color: 'text-emerald-400' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-muted/10 border border-border rounded-2xl group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm ${item.color}`}>
                            <item.icon className="w-4 h-4" />
                         </div>
                         <span className="text-xs font-bold text-foreground">{item.label}</span>
                      </div>
                      <input
                        type="number"
                        value={alerts[item.key as keyof AlertConfig] as number}
                        onChange={e => setAlerts(p => ({ ...p, [item.key]: +e.target.value }))}
                        className="w-16 px-2 py-2 bg-white dark:bg-slate-900 border border-border rounded-xl text-center text-xs font-black text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                  ))}
                  
                  <div className="pt-4 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Notifications Email</span>
                     </div>
                     <button 
                       onClick={() => setAlerts({...alerts, alert_enabled: !alerts.alert_enabled})}
                       className={`w-12 h-6 rounded-full relative transition-all ${alerts.alert_enabled ? 'bg-primary' : 'bg-muted'}`}
                     >
                       <div className={`absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 transition-all ${alerts.alert_enabled ? 'left-7' : 'left-1'}`} />
                     </button>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-primary rounded-2xl p-6 text-gray-900 dark:text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
                 <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                       <Brain className="w-5 h-5" />
                       <h3 className="text-xs font-black uppercase tracking-widest">IA Prédictive</h3>
                    </div>
                    <p className="text-xs font-medium leading-relaxed opacity-90 mb-4">
                       L'IA peut recalculer les seuils optimaux en fonction du volume d'appels hebdomadaire pour réduire les faux positifs.
                    </p>
                    <button className="w-full py-3 bg-white dark:bg-slate-900/20 backdrop-blur-md border border-white/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white dark:bg-slate-900/30 transition-all flex items-center justify-center gap-2">
                       <Sparkles className="w-3 h-3" /> Optimisation Automatique
                    </button>
                 </div>
                 <Zap className="absolute -bottom-4 -right-4 w-24 h-24 text-gray-900 dark:text-white opacity-5 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>


        </>
      ) : (
        /* Alert History Tab */
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <History className="w-4 h-4 text-primary" />
                 <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Historique des Anomalies</h3>
              </div>
              <button className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline flex items-center gap-1">
                 <Trash2 className="w-3 h-3" /> Effacer Tout
              </button>
           </div>
           <div className="divide-y divide-border">
              {alertHistory.map((item, idx) => (
                 <div key={item.id || `alert-hist-${idx}`} className="p-6 hover:bg-muted/10 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                         item.type === 'critical' ? 'bg-red-500 text-white' : 
                         item.type === 'warning' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                       }`}>
                          <AlertTriangle className="w-6 h-6" />
                       </div>
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className="text-xs font-black uppercase tracking-widest text-foreground">{item.agent_name}</span>
                             <span className="text-[10px] font-bold text-muted-foreground">•</span>
                             <span className="text-[10px] font-bold text-muted-foreground">{item.timestamp}</span>
                          </div>
                          <p className="text-sm font-medium text-foreground">{item.message}</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => setSelectedAlert(item)}
                      className="px-4 py-2 bg-muted rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white"
                    >
                       Inspecter l'appel
                    </button>
                 </div>
              ))}
              {alertHistory.length === 0 && (
                <div className="p-20 text-center text-muted-foreground">
                   <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                   <p className="text-sm font-bold uppercase tracking-widest">Aucune alerte récente</p>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}