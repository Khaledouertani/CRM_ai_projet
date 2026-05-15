import React, { useState, useEffect } from 'react';
import { Clock, UserCheck, AlertCircle, Calendar, Loader2, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export default function PointagePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getPointageData();
      setData(res);
    } catch (e) {
      console.error('Pointage load error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-muted-foreground">Analyse du pointage IA...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2>Détection du Pointage IA</h2>
          <p className="text-muted-foreground mt-1">
            Relevé automatique des présences basé sur l'activité réelle (Premier et dernier appel)
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-medium">Aujourd'hui, {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 text-success rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Agents Présents</p>
              <p className="text-xl font-bold">{data.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 text-warning rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Retards Détectés</p>
              <p className="text-xl font-bold">{data.filter(a => a.is_late).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Moyenne de Présence</p>
              <p className="text-xl font-bold">~7h 45m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pointage Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <h3 className="text-sm font-bold uppercase tracking-wider">Feuille de présence automatisée</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left p-4 font-medium text-muted-foreground">Agent</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Premier Appel (Début)</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Dernier Appel (Fin)</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Appels Total</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Dureé Productive</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status RH</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-b border-border hover:bg-muted/10 transition-colors">
                  <td className="p-4 font-bold">{row.agent}</td>
                  <td className="p-4">
                    <span className={row.is_late ? 'text-warning font-semibold' : 'text-foreground'}>
                      {row.first_call}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={row.is_early_exit ? 'text-info font-semibold' : 'text-foreground'}>
                      {row.last_call}
                    </span>
                  </td>
                  <td className="p-4 font-medium">{row.total_calls} calls</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                       {row.productive_time}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      row.is_late ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground italic">
                    Aucune activité détectée pour le moment aujourd'hui.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contextual Warning */}
      <div className="bg-info/10 border border-info/20 rounded-xl p-5 flex items-start gap-4">
        <AlertCircle className="w-5 h-5 text-info shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-info mb-1">Comment le pointage est-il calculé ?</h4>
          <p className="text-xs text-info/80 leading-relaxed">
            Le système utilise l'heure exacte de la première et de la dernière activité (appel analysé) pour déduire la 
            période de présence productive des agents. Les retards sont marqués si le premier appel est détecté 
            après 09:15. Ce système élimine toute saisie manuelle de la part des agents.
          </p>
        </div>
      </div>
    </div>
  );
}
