import React, { useState, useEffect } from 'react';
import { Shield, Save, CheckCircle, XCircle, RotateCw, Search, Users as UsersIcon, Lock, CheckCheck } from 'lucide-react';
import { getAllRolePermissions, setRolePermission } from '../../services/api';
import toast from 'react-hot-toast';

interface RolePerm {
  role: string;
  permissionId: number;
  permissionName: string;
  module: string;
  granted: boolean;
}

type ModuleGroup = {
  module: string;
  permissions: { name: string; id: number }[];
};

export default function PermissionsPage() {
  const [data, setData] = useState<RolePerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState<string>('all');

  const roles = ['admin', 'qualite', 'agent'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getAllRolePermissions();
      setData(result);
    } catch {
      toast.error('Erreur chargement des permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const modules = React.useMemo(() => {
    const uniqueModules = [...new Set(data.map(r => r.module))].sort();
    const allPerms = [...new Map(data.map(r => [r.permissionName, { name: r.permissionName, id: r.permissionId }])).values()];
    const grouped: ModuleGroup[] = uniqueModules.map(mod => ({
      module: mod,
      permissions: allPerms.filter(p => p.name.startsWith(mod + '.')),
    }));
    return grouped;
  }, [data]);

  const getGranted = (permName: string, role: string) =>
    data.find(r => r.permissionName === permName && r.role === role)?.granted ?? false;

  const handleToggle = async (permName: string, role: string, current: boolean) => {
    const key = `${role}_${permName}`;
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      await setRolePermission(role, permName, !current);
      setData(prev =>
        prev.map(r =>
          r.permissionName === permName && r.role === role
            ? { ...r, granted: !current }
            : r
        )
      );
      toast.success(`${permName} → ${!current ? 'Activé' : 'Désactivé'} pour ${role}`);
    } catch {
      toast.error('Erreur lors de la modification');
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const isRoleActive = (role: string) => activeRole === 'all' || activeRole === role;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Gestion des <span className="text-primary">Permissions</span>
          </h1>
          <p className="text-xs text-muted-foreground font-medium mt-1">
            Attribuez ou retirez des permissions spécifiques à chaque rôle
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 bg-card p-1.5 rounded-2xl border border-border">
          {[{ id: 'all', label: 'Tous' }, ...roles.map(r => ({ id: r, label: r }))].map(r => (
            <button
              key={r.id}
              onClick={() => setActiveRole(r.id)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeRole === r.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une permission..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map(mod => {
            const filteredPerms = mod.permissions.filter(p =>
              p.name.toLowerCase().includes(search.toLowerCase())
            );
            if (filteredPerms.length === 0) return null;

            return (
              <div key={mod.module} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-3">
                  <Lock className="w-4 h-4 text-primary" />
                  <h3 className="font-black text-xs uppercase tracking-widest text-foreground">{mod.module}</h3>
                  <span className="text-[9px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {filteredPerms.length}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        <th className="text-left p-4">Permission</th>
                        {roles.filter(isRoleActive).map(role => (
                          <th key={role} className="text-center p-4 min-w-[100px]">{role}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPerms.map(perm => {
                        return (
                          <tr key={perm.name} className="border-b border-border hover:bg-muted/5 transition-colors">
                            <td className="p-4 text-xs font-bold text-foreground whitespace-nowrap">
                              {perm.name}
                            </td>
                            {roles.filter(isRoleActive).map(role => {
                              const granted = getGranted(perm.name, role);
                              const key = `${role}_${perm.name}`;
                              const isSaving = saving[key];

                              return (
                                <td key={role} className="text-center p-4">
                                  <button
                                    onClick={() => handleToggle(perm.name, role, granted)}
                                    disabled={isSaving}
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
                                      granted
                                        ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                        : 'bg-muted/30 text-muted-foreground/40 hover:bg-muted hover:text-muted-foreground'
                                    } disabled:opacity-50`}
                                    title={granted ? 'Désactiver' : 'Activer'}
                                  >
                                    {isSaving ? (
                                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : granted ? (
                                      <CheckCheck className="w-4 h-4" />
                                    ) : (
                                      <XCircle className="w-4 h-4" />
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
