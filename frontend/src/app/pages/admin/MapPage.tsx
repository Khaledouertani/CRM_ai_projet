import React, { useState } from 'react';
import {
  MapPin, TrendingUp, Filter, Globe, Map as MapIcon,
  Navigation, MousePointer2, Target, Users, ArrowUpRight
} from 'lucide-react';

const regionsData = [
  { id: 1, region: 'Tunis', appels: 1560, conversions: 980, taux: 62.8, color: '#6366f1' },
  { id: 2, region: 'Sfax', appels: 890, conversions: 520, taux: 58.4, color: '#8b5cf6' },
  { id: 3, region: 'Sousse', appels: 720, conversions: 450, taux: 62.5, color: '#ec4899' },
  { id: 4, region: 'Paris', appels: 1240, conversions: 820, taux: 66.1, color: '#3b82f6' },
  { id: 5, region: 'Lyon', appels: 980, conversions: 620, taux: 63.3, color: '#10b981' },
  { id: 6, region: 'Marseille', appels: 860, conversions: 480, taux: 55.8, color: '#f59e0b' },
  { id: 7, region: 'Nabeul', appels: 450, conversions: 280, taux: 62.2, color: '#06b6d4' },
  { id: 8, region: 'Bizerte', appels: 380, conversions: 220, taux: 57.9, color: '#f43f5e' }
];

export default function MapPage() {
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [hoveredRegion, setHoveredRegion] = useState<any>(null);

  const filteredData = selectedCountry === 'all' ? regionsData :
    selectedCountry === 'tunisia' ? regionsData.filter(r => ['Tunis', 'Sfax', 'Sousse', 'Nabeul', 'Bizerte'].includes(r.region)) :
    regionsData.filter(r => ['Paris', 'Lyon', 'Marseille'].includes(r.region));

  const totalCalls = filteredData.reduce((sum, r) => sum + r.appels, 0);
  const totalConvs = filteredData.reduce((sum, r) => sum + r.conversions, 0);
  const avgTaux = (filteredData.reduce((sum, r) => sum + r.taux, 0) / filteredData.length).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          <Globe className="w-40 h-40" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Intelligence Territoriale</span>
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Distribution <span className="text-primary">Géo-Lead</span>
          </h1>
          <p className="text-muted-foreground text-xs font-medium mt-1">Analyse des flux de conversion par zone géographique</p>
        </div>
        
        <div className="flex items-center gap-3 bg-muted/50 p-1.5 rounded-xl border border-border relative z-10">
          <div className="pl-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
          </div>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="pr-10 pl-2 py-2 bg-transparent text-slate-900 text-xs font-black uppercase tracking-widest focus:outline-none cursor-pointer appearance-none"
          >
            <option value="all">Zones Globales</option>
            <option value="tunisia">Tunisie (MENA)</option>
            <option value="france">France (EU)</option>
          </select>
          <div className="pr-3 pointer-events-none">
            <MousePointer2 className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Statistics Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">KPIs Régionaux</h3>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-foreground">{totalCalls.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Appels Totaux</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Navigation className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-emerald-500">{totalConvs.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Conversions Géo</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Target className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-primary">{avgTaux}%</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Taux d'Efficacité</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Top Performers</h3>
            <div className="space-y-3">
              {filteredData.sort((a, b) => b.taux - a.taux).slice(0, 4).map((r, i) => (
                <div key={r.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px]" style={{ backgroundColor: `${r.color}20`, color: r.color }}>
                    #{i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase text-foreground">{r.region}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">{r.conversions} RDV</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-primary">{r.taux}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Grid Map */}
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-8 shadow-sm relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
            <MapIcon className="w-96 h-96" />
          </div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
               <MapPin className="w-4 h-4 text-primary" /> Visualisation Territoriale
            </h3>
            <div className="flex items-center gap-2">
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Optimisé</span>
               </div>
               <div className="flex items-center gap-1.5 ml-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Critique</span>
               </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
            {filteredData.map((region) => (
              <div
                key={region.id}
                onMouseEnter={() => setHoveredRegion(region)}
                onMouseLeave={() => setHoveredRegion(null)}
                className="group relative"
              >
                <div className={`h-full p-6 rounded-3xl border-2 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl cursor-pointer overflow-hidden relative ${
                  region.taux >= 63 ? 'bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5' :
                  region.taux >= 59 ? 'bg-primary/5 border-primary/20 shadow-primary/5' :
                  'bg-orange-500/5 border-orange-500/20 shadow-orange-500/5'
                }`}>
                  {/* Glow effect on hover */}
                  <div className="absolute -inset-20 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-3xl" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-2.5 rounded-xl shadow-lg ${
                        region.taux >= 63 ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                        region.taux >= 59 ? 'bg-primary text-white shadow-primary/20' :
                        'bg-orange-500 text-white shadow-orange-500/20'
                      }`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase">{region.appels}</span>
                      </div>
                    </div>
                    
                    <h4 className="text-lg font-black italic tracking-tighter uppercase mb-1">{region.region}</h4>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-black text-foreground">{region.taux}%</span>
                      <span className="text-[10px] font-black uppercase text-muted-foreground opacity-50">Taux</span>
                    </div>

                    <div className="space-y-2">
                       <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${
                            region.taux >= 63 ? 'bg-emerald-500' :
                            region.taux >= 59 ? 'bg-primary' :
                            'bg-orange-500'
                          }`} style={{ width: `${region.taux}%` }}></div>
                       </div>
                       <div className="flex justify-between text-[9px] font-black uppercase opacity-40">
                          <span>0%</span>
                          <span>{region.conversions} RDV</span>
                       </div>
                    </div>
                    
                    <button className="mt-6 w-full py-2 rounded-xl bg-muted/50 border border-border text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-2 group-hover:shadow-lg">
                      Détails Flux <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between text-muted-foreground relative z-10">
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                   <span className="text-[10px] font-bold uppercase tracking-widest">Données synchronisées</span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Mise à jour: {new Date().toLocaleTimeString()}</div>
             </div>
             <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Système Géo-Analysis v2.1</div>
          </div>
        </div>
      </div>
    </div>
  );
}
