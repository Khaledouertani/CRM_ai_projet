import React, { useState } from 'react';
import {
  Settings, Database, Shield, Bell, Mail, Save,
  Trash2, Download, Upload, RefreshCw, CheckCircle, AlertTriangle,
  Lock, Globe, Clock, MessageSquare, ShieldCheck, Mic
} from 'lucide-react';
import api from '../../services/api';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [config, setConfig] = useState({
    companyName: 'CRM Energie Solaire',
    adminEmail: 'admin@energie.fr',
    timezone: 'Europe/Paris',
    language: 'fr',
    sessionTimeout: 30,
    maxFailedLogin: 3,
    dataRetention: 365,
    backupEnabled: true,
    alertSound: true,
  });

  const [rgpdConfig, setRgpdConfig] = useState<Record<number, boolean>>({});

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      await api.saveConfig(config);
      setSaving(false);
      setSaveMsg('Configuration enregistrée !');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (error) {
      setSaving(false);
      setSaveMsg('Erreur lors de l\'enregistrement');
    }
  };

  const handleBackup = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_crm_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch {
      alert('Erreur backup');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm('Attention: Cela va écraser les données actuelles. Continuer ?')) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await api.importData(json);
        alert('Restauration réussie !');
        window.location.reload();
      } catch (err) {
        alert('Erreur lors de l\'importation');
      }
    };
    reader.readAsText(file);
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'data', label: 'Données', icon: Database },
    { id: 'rgpd', label: 'RGPD', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Paramètres <span className="text-primary">Système</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Configuration globale et conformité de l'application</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {saveMsg && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${saveMsg.includes('Erreur') ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
          <CheckCircle className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">{saveMsg}</span>
        </div>
      )}

      {/* Custom Tabs Navigation */}
      <div className="flex bg-card p-1 rounded-2xl border border-border overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 gap-6">
        {activeTab === 'general' && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Configuration de base</h3>
            </div>
            <div className="p-8 space-y-6 max-w-2xl">
              <div className="grid gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nom de l'entreprise</label>
                <input
                  className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  value={config.companyName}
                  onChange={e => setConfig({ ...config, companyName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email administrateur</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  value={config.adminEmail}
                  onChange={e => setConfig({ ...config, adminEmail: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fuseau horaire</label>
                  <select
                    className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                    value={config.timezone}
                    onChange={e => setConfig({ ...config, timezone: e.target.value })}
                  >
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="Africa/Tunis">Africa/Tunis</option>
                    <option value="America/New_York">America/New_York</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Langue</label>
                  <select
                    className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                    value={config.language}
                    onChange={e => setConfig({ ...config, language: e.target.value })}
                  >
                    <option value="fr">Français 🇫🇷</option>
                    <option value="en">English 🇺🇸</option>
                    <option value="ar">العربية 🇹🇳</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Paramètres de sécurité</h3>
            </div>
            <div className="p-8 space-y-8 max-w-2xl">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timeout session (minutes)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={config.sessionTimeout}
                    onChange={e => setConfig({ ...config, sessionTimeout: +e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Essais max avant verrouillage</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={config.maxFailedLogin}
                    onChange={e => setConfig({ ...config, maxFailedLogin: +e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-foreground">Alertes Sonores</p>
                  <p className="text-[10px] font-medium text-muted-foreground">Jouer un son lors d'une alerte supervision</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, alertSound: !config.alertSound })}
                  className={`w-12 h-6 rounded-full transition-all relative ${config.alertSound ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 transition-all ${config.alertSound ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
              <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Maintenance des données</h3>
              <Database className="w-4 h-4 text-primary" />
            </div>
            <div className="p-8 space-y-8 max-w-2xl">
              <div className="grid gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rétention des logs (jours)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  value={config.dataRetention}
                  onChange={e => setConfig({ ...config, dataRetention: +e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <button onClick={handleBackup} className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-border rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group">
                  <Download className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Exporter Backup</p>
                    <p className="text-[9px] font-medium text-muted-foreground">Format JSON structuré</p>
                  </div>
                </button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <button className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-border rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group">
                    <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Importer Backup</p>
                      <p className="text-[9px] font-medium text-muted-foreground">Restaurer une session</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-8 border-t border-border">
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Zone Critique</h4>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground mb-4 leading-relaxed">
                    La suppression globale des données est irréversible. Toutes les statistiques, appels et messages seront définitivement effacés.
                  </p>
                  <button className="flex items-center gap-2 px-6 py-2.5 bg-red-500 text-white rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-red-600 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer tout le CRM
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rgpd' && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
              <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Protection des Données (RGPD)</h3>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="p-8 space-y-4">
              {[
                { id: 1, title: 'Droit à l\'effacement', desc: 'Permettre aux leads de demander la suppression de leurs données personnelles.', icon: Trash2 },
                { id: 2, title: 'Portabilité des données', desc: 'Exporter les données complètes d\'un utilisateur sous format machine.', icon: Download },
                { id: 3, title: 'Consentement explicite', desc: 'Activer la demande de consentement obligatoire lors de l\'inscription.', icon: CheckCircle },
                { id: 4, title: 'Journal d\'audit accès', desc: 'Générer un log complet de tous les accès aux données sensibles.', icon: Lock },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-muted/20 border border-border rounded-2xl group hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm text-muted-foreground group-hover:text-emerald-500 transition-colors">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-foreground">{item.title}</p>
                      <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setRgpdConfig({...rgpdConfig, [item.id]: !rgpdConfig[item.id]})}
                    className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${
                      rgpdConfig[item.id] ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-slate-900 border border-border text-foreground hover:bg-emerald-500 hover:text-white'
                    }`}
                  >
                    {rgpdConfig[item.id] ? 'Activé' : 'Activer'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}