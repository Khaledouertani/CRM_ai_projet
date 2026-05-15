import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Headphones,
  Target,
  Mail,
  Settings,
  ChevronLeft,
  ChevronRight,
  Phone,
  Calendar,
  TrendingUp,
  MessageCircle,
  Sparkles,
  LogOut,
  Sliders,
  Bell,
  Shield,
  Mic,
  Activity,
  Map as MapIcon,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: string;
  accent?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const agentSections: NavSection[] = [
    {
      label: 'PRINCIPAL',
      items: [
        { icon: LayoutDashboard, label: 'Tableau de bord', path: '/agent/dashboard', accent: 'blue' },
        { icon: TrendingUp, label: 'Performance', path: '/agent/performance', accent: 'green' },
        { icon: Mail, label: 'Messages', path: '/agent/messages', accent: 'purple' },
      ],
    },
    {
      label: 'ACTIVITÉ',
      items: [
        { icon: Phone, label: 'Appel en direct', path: '/agent/contact', accent: 'orange' },
        { icon: Users, label: 'Contacts', path: '/agent/contacts' },
        { icon: Calendar, label: 'Agenda', path: '/agent/agenda' },
      ],
    },
    {
      label: 'IA',
      items: [
        { icon: MessageCircle, label: 'Chatbot IA', path: '/chatbot', accent: 'blue' },
      ],
    },
  ];

  const adminSections: NavSection[] = [
    {
      label: 'PRINCIPAL',
      items: [
        { icon: Activity, label: 'Supervision Live', path: '/admin/realtime', accent: 'green' },
      ],
    },
    {
      label: 'OPÉRATIONS',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard', accent: 'blue' },
        { icon: Users, label: 'Équipes & Agents', path: '/admin/performance', accent: 'blue' },
        { icon: Target, label: 'Leads & CRM', path: '/admin/leads', accent: 'orange' },
      ],
    },
    {
      label: 'IA & QUALITÉ',
      items: [
        { icon: Bell, label: 'Alertes & Scoring', path: '/admin/scoring', accent: 'orange' },
        { icon: Mic, label: 'Analyse Audio', path: '/admin/analysis', accent: 'blue' },
        { icon: MessageCircle, label: 'Chatbot IA', path: '/chatbot', accent: 'purple' },
      ],
    },
    {
      label: 'COMMUNICATION',
      items: [
        { icon: Mail, label: 'Messages', path: '/admin/messages', accent: 'blue' },
      ],
    },

    {
      label: 'SYSTÈME',
      items: [
        { icon: Settings, label: 'Paramètres', path: '/admin/settings', accent: 'blue' },
      ],
    },
  ];

  const qualiteSections: NavSection[] = [
    {
      label: 'QUALITÉ',
      items: [
        { icon: LayoutDashboard, label: 'Tableau de bord', path: '/qualite/dashboard', accent: 'blue' },
        { icon: MessageSquare, label: 'Messagerie', path: '/qualite/messages', accent: 'purple' },
      ],
    },
    {
      label: 'ÉVALUATIONS',
      items: [
        { icon: Users, label: 'Performance Agents', path: '/qualite/agents', accent: 'green' },
        { icon: Target, label: 'Comparaison', path: '/qualite/compare', accent: 'orange' },
      ],
    },
    {
      label: 'IA',
      items: [
        { icon: MessageCircle, label: 'Chatbot IA', path: '/chatbot', accent: 'purple' },
      ],
    },
  ];

  const sections = user?.role === 'admin' ? adminSections : user?.role === 'qualite' ? qualiteSections : agentSections;

  const accentColors: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/30',
    green: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/30',
    orange: 'from-orange-500/20 to-orange-600/10 text-orange-400 border-orange-500/30',
    red: 'from-red-500/20 to-red-600/10 text-red-400 border-red-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/30',
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      className={`h-screen flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'w-[68px]' : 'w-[240px]'
        }`}
      style={{
        background: 'linear-gradient(180deg, hsl(var(--sidebar)) 0%, hsl(var(--sidebar)) 100%)',
        borderRight: '1px solid hsl(var(--sidebar-border))',
      }}
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-4 h-4 text-gray-900 dark:text-white" />
            </div>
            <div>
              <span className="font-black text-[15px] tracking-tight text-sidebar-foreground">AI</span>
              <span className="font-black text-[15px] tracking-tight text-primary"> CRM</span>
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-50 leading-none mt-0.5">Pro v2.0</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 mx-auto">
            <Sparkles className="w-4 h-4 text-gray-900 dark:text-white" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-sidebar-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="p-2 mx-auto mt-2 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-sidebar-foreground"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className={sIdx > 0 ? 'mt-4' : ''}>
            {/* Section Label */}
            {section.label && !collapsed && (
              <div className="px-3 mb-1.5">
                <span className="text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground/40">
                  {section.label}
                </span>
              </div>
            )}

            {/* Section divider when collapsed */}
            {section.label && collapsed && sIdx > 0 && (
              <div className="mx-3 my-2 border-t border-sidebar-border/50" />
            )}

            {/* Items */}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const accentClass = item.accent ? accentColors[item.accent] : '';

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={`
                        flex items-center gap-3 rounded-xl transition-all duration-200 relative group
                        ${collapsed ? 'px-0 py-2 justify-center' : 'px-3 py-2.5'}
                        ${active
                          ? item.accent
                            ? `bg-gradient-to-r ${accentClass} border font-semibold shadow-sm`
                            : 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                        }
                      `}
                    >
                      <Icon
                        className={`w-[18px] h-[18px] flex-shrink-0 transition-transform group-hover:scale-110 ${active && item.accent ? accentColors[item.accent].split(' ')[2] : ''
                          }`}
                      />
                      {!collapsed && (
                        <span className="text-[13px] font-medium truncate">{item.label}</span>
                      )}
                      {item.badge && !collapsed && (
                        <span className="ml-auto text-[10px] font-bold bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {item.badge}
                        </span>
                      )}

                      {/* Tooltip on collapsed */}
                      {collapsed && (
                        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs font-semibold rounded-lg shadow-xl border border-border opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                          {item.label}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Profile + Logout */}
      <div className="border-t border-sidebar-border px-2 py-3 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sidebar-accent transition-colors group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-indigo-600/80 flex items-center justify-center text-gray-900 dark:text-white text-xs font-black shadow-md shrink-0">
              {user?.name?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-sidebar-foreground truncate">{user?.name || user?.username}</p>
              <p className="text-[10px] font-semibold text-muted-foreground capitalize">{user?.role === 'admin' ? '👑 Administrateur' : '🎧 Agent'}</p>
            </div>
            <button
              onClick={logout}
              title="Se déconnecter"
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            title="Se déconnecter"
            className="w-full p-2 flex justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
