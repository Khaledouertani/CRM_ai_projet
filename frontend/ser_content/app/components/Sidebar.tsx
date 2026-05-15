import React, { useState } from 'react';
import { Link, useLocation } from 'react-router- dom';
import { 
  ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon,
  LayoutDashboard, Headphones, BarChart3, FileText, Users, Target, Map, Clock,
  Plug, MessageCircle, Sparkles, Shield, Settings, Sliders, Bell, Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem { label: string; icon: React.ElementType; path: string; }
interface NavSection { label: string; icon: React.ElementType; children: NavItem[]; }

const adminNavSections: NavSection[] = [
  {
    label: 'Dashboard', icon: LayoutDashboard, children: [
      { label: 'Vue globale', icon: LayoutDashboard, path: '/admin/dashboard' },
      { label: 'Audit Audio', icon: Headphones, path: '/analysis' },
    ]  },
  {
    label: 'Performance', icon: Activity, children: [
      { label: 'Classement', icon: FileText, path: '/admin/dashboard' },
      { label: 'Temps Réel', icon: Activity, path: '/admin/realtime' },
    ]  },
  {
    label: 'Configuration', icon: Settings, children: [
      { label: 'Scoring', icon: Sliders, path: '/admin/scoring' },
      { label: 'Paramètres', icon: Settings, path: '/admin/settings' },
    ]  },
  {
    label: 'Prospects', icon: Users, children: [
      { label: 'Liste leads', icon: Users, path: '/admin/leads' },
      { label: 'Importer', icon: Plug, path: '/admin/import- leads' },
    ]  },
  {
    label: 'Analytique', icon: BarChart3, children: [
      { label: 'Vue globale', icon: BarChart3, path: '/admin/analytics' },
      { label: 'Statistiques', icon: FileText, path: '/admin/agent-stats' },
    ]  },
  {
    label: 'Outils', icon: Sparkles, children: [
      { label: 'Planification', icon: Clock, path: '/admin/planning' },
      { label: 'Chatbot IA', icon: MessageCircle, path: '/chatbot' },
      { label: 'Suivi prospects', icon: Target, path: '/admin/followups' },
    ]  },
  {
    label: 'Sécurité', icon: Shield, children: [
      { label: 'Audit RGPD', icon: Shield, path: '/admin/gdpr' },
    ]  },
];

interface SidebarProps { collapsed: boolean; onToggle: () => void; }
export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();  const { user } = useAuth();  const [expandedSections, setExpandedSections] = useState< Set<string>>(new Set(['Dashboard', 'Configuration']));
  const toggleSection = (label: string) => {
    setExpandedSections(prev => {      const next = new Set(prev);
      if (next.has(label)) next.delete(label);      else next.add(label);      return next;
    });
  };
  const isActive = (path: string) => location.pathname === path;
  return (
    <div className={cn(    "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
      collapsed ? 'w-16' : 'w-64'
    )}>      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">        {!collapsed && (          <div className="flex flex-col">            <span className="font-black text-xl italic tracking-tighter text-primary">AI CRM</span>            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Production v2.0</span>          </div>        )}        <button onClick={onToggle} className="p-2 rounded-md hover:bg-sidebar-accent transition-colors">          {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}        </button>      </div>      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">        <nav className="space-y-1 px-2">          {!collapsed ? (            adminNavSections.map(section => {              const isExpanded = expandedSections.has(section.label);              const hasActiveChild = section.children.some(c => isActive(c.path));              return (                <div key={section.label} className="space-y-1">                  <button                    onClick={() => toggleSection(section.label)}                    className={cn(                      "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      hasActiveChild ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent'                    )}                  >                    <div className="flex items-center gap-3">                      <section.icon className="h-4 w-4 shrink-0" />                      <span>{section.label}</span>                    </div>                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}                  </button>                  {isExpanded && section.children.map(item => (                    <Link                      key={item.path}                      to={item.path}                      className={cn(                        "flex items-center gap-3 pl-10 pr-3 py-2 rounded-md text-sm transition-colors",                        isActive(item.path)                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'                          : 'hover:bg-sidebar-accent'                      )}                    >                      <item.icon className="h-4 w-4 shrink-0" />                      <span>{item.label}</span>                    </Link>                  ))}                </div>              );            })          ) : (            adminNavSections.map(section => (              <div key={section.label} className="group relative">                <Link                  to={section.children[0].path}                  className={cn(                    "flex items-center justify-center p-2 rounded-md transition-colors",                    section.children.some(c => isActive(c.path))                      ? 'bg-sidebar-accent'                      : 'hover:bg-sidebar-accent'                  )}                >                  <section.icon className="h-5 w-5" />                </Link>                <div className="absolute left-full top-0 ml-2 hidden group-hover:block z-50 min-w-48 bg-background border rounded-md shadow-lg p-2 space-y-1">                  {section.children.map(item => (                    <Link                      key={item.path}                      to={item.path}                      className={cn(                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm",                        isActive(item.path) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'                      )}                    >                      <item.icon className="h-4 w-4" />                      <span>{item.label}</span>                    </Link>                  ))}                </div>              </div>            ))}          )}        </nav>      </ScrollArea>      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">        <div className={cn("text-xs text-muted-foreground", collapsed ? 'text-center' : '')}>          {collapsed ? (            <Settings className="h-4 w-4 mx-auto" />          ) : (            <p>v2.0.0</p>          )}        </div>      </div>    </div>  );
}