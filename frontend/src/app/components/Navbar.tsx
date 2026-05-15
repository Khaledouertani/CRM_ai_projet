import React, { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, User, Mail, Shield, CheckCircle, Settings, HelpCircle, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertContext';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
  const { user, logout } = useAuth();
  const { alerts, removeAlert } = useAlerts();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabels: Record<string, string> = {
    agent: 'Agent',
    confirmatrice1: 'Confirmatrice 1',
    confirmatrice2: 'Confirmatrice 2',
    admin: 'Administrateur',
    qualite: 'Service Qualité',
    technique: 'Service Technique'
  };



  return (
    <nav className="h-16 border-b border-border bg-card px-6 flex items-center justify-between relative z-50">
      <div>
        <h1 className="font-bold text-foreground italic flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
          Bienvenue, <span className="text-primary">{user?.name}</span>
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
          {user && roleLabels[user.role]} • Session Active
        </p>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* NOTIFICATIONS DROPDOWN */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className={`relative flex items-center justify-center w-10 h-10 rounded-xl border transition-all ${
              showNotifications ? 'bg-primary/10 border-primary text-primary' : 'border-border bg-card hover:bg-accent text-foreground'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-card border-2 border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <h3 className="font-black uppercase italic tracking-tighter text-xs">Notifications</h3>
                {alerts.length > 0 && (
                  <span className="bg-destructive/10 text-destructive text-[9px] px-2 py-0.5 rounded-full font-black">
                    {alerts.length} ALERTES
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alerts.length > 0 ? (
                  alerts.map(n => (
                    <div key={n.id} className="p-4 border-b border-border last:border-0 hover:bg-muted/10 transition-colors group relative">
                      <div className="flex justify-between items-start mb-1 pr-6">
                        <span className={`font-bold text-xs ${n.type === 'critical' ? 'text-destructive' : 'text-foreground'}`}>{n.title}</span>
                        <span className="text-[10px] text-muted-foreground">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{n.message}</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeAlert(n.id); }}
                        className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Tout est sous contrôle</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* PROFILE DROPDOWN */}
        <div className="relative pl-2 ml-2 border-l border-border" ref={profileRef}>
          <button 
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className={`flex items-center gap-2 p-1 pr-3 rounded-xl transition-all ${
              showProfile ? 'bg-primary/10' : 'hover:bg-muted/50'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-black italic tracking-tighter text-foreground uppercase">{user?.username}</p>
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-3 w-64 bg-card border-2 border-border rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 bg-primary/5 text-center border-b border-border">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20 ring-4 ring-card">
                  <User className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-black italic tracking-tighter text-lg uppercase text-primary">{user?.name}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
                  {user && roleLabels[user.role]}
                </p>
              </div>

              <div className="p-3 space-y-1">
                <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted transition-colors group cursor-pointer">
                  <div className="p-2 bg-muted rounded-xl group-hover:bg-card transition-colors">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">E-mail</p>
                    <p className="text-xs font-bold truncate italic">{user?.username}@crm-ai.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted transition-colors group cursor-pointer">
                  <div className="p-2 bg-muted rounded-xl group-hover:bg-card transition-colors">
                    <Shield className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Niveau d'accès</p>
                    <p className="text-xs font-bold italic">Privilèges {user?.role}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted/20 flex flex-col gap-2">
                <button className="flex items-center justify-center gap-2 w-full py-3 bg-card border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all">
                  <Settings className="w-3.5 h-3.5" /> Paramètres
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-destructive hover:text-gray-900 dark:text-white transition-all shadow-lg shadow-destructive/5"
                >
                  <LogOut className="w-3.5 h-3.5" /> Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

