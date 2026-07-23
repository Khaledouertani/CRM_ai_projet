import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, CheckCircle, XCircle, Clock, RefreshCw,
  ChevronDown, ChevronUp, Eye, Filter, Phone, User,
  MapPin, Home, Thermometer, Banknote, Search, Users
} from 'lucide-react';
import * as api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  pending:       { bg: 'bg-orange-500/20',  text: 'text-orange-400',   border: 'border-orange-500/30',  dot: 'bg-orange-500',   label: 'En attente' },
  confirmed:     { bg: 'bg-emerald-500/20', text: 'text-emerald-400',  border: 'border-emerald-500/30', dot: 'bg-emerald-500',  label: 'Confirmé' },
  cancelled:     { bg: 'bg-red-500/20',     text: 'text-red-400',      border: 'border-red-500/30',     dot: 'bg-red-500',      label: 'Annulé' },
  rescheduled:   { bg: 'bg-blue-500/20',   text: 'text-blue-400',    border: 'border-blue-500/30',    dot: 'bg-blue-500',     label: 'Reprogrammé' },
  nrp:           { bg: 'bg-gray-500/20',   text: 'text-gray-400',    border: 'border-gray-500/30',    dot: 'bg-gray-500',     label: 'NRP' },
  hc:            { bg: 'bg-gray-500/20',   text: 'text-gray-400',    border: 'border-gray-500/30',     dot: 'bg-gray-500',    label: 'HC' },
  not_interested:{ bg: 'bg-gray-500/20',   text: 'text-gray-400',    border: 'border-gray-500/30',     dot: 'bg-gray-500',    label: 'Pas intéressé' },
};

const ACTION_STATUSES = ['confirmed', 'cancelled', 'rescheduled', 'nrp', 'hc', 'not_interested'];

function getStatusStyle(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
}

export default function QualityAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [changingId, setChangingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [aptData, agentsData] = await Promise.all([
        api.getAppointments(),
        api.getAgents(),
      ]);
      setAppointments(Array.isArray(aptData) ? aptData : []);
      setAgents(Array.isArray(agentsData) ? agentsData : []);
    } catch (e) {
      console.error('Failed to fetch appointments', e);
      toast.error('Erreur de chargement des rendez-vous');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (appointmentId: number, newStatus: string) => {
    setChangingId(appointmentId);
    try {
      await api.updateAppointmentStatus(appointmentId, newStatus);
      toast.success(`RDV #${appointmentId} → ${getStatusStyle(newStatus).label}`);
      fetchData();
    } catch (e: any) {
      const msg = e?.message || 'Erreur lors du changement de statut';
      toast.error(msg);
    } finally {
      setChangingId(null);
    }
  };

  const filtered = appointments.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterAgent !== 'all' && String(a.agent_id) !== filterAgent) return false;
    if (filterDate) {
      const aptDate = a.appointment_date ? new Date(a.appointment_date).toISOString().split('T')[0] : '';
      if (aptDate !== filterDate) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (a.client_name || '').toLowerCase().includes(q) ||
        (a.agent_name || '').toLowerCase().includes(q) ||
        (a.client_phone || '').includes(q) ||
        (a.project_type || '').toLowerCase().includes(q) ||
        String(a.id).includes(q)
      );
    }
    return true;
  });

  const statusCounts = appointments.reduce((acc, a) => {
    const s = a.status || 'pending';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalRdv = appointments.length;
  const pendingCount = statusCounts['pending'] || 0;
  const confirmedCount = statusCounts['confirmed'] || 0;
  const cancelledCount = statusCounts['cancelled'] || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Validation <span className="text-[#7c3aed]">Rendez-vous</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">Service Qualité — Confirmer, annuler ou reprogrammer les RDV</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-gray-300 hover:bg-white/10 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-[#7c3aed]/20 to-purple-500/20 border border-[#7c3aed]/30 rounded-xl p-4">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Total RDV</p>
            <p className="text-2xl font-bold text-white">{totalRdv}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-xl p-4">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">En attente</p>
            <p className="text-2xl font-bold text-orange-400">{pendingCount}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Confirmés</p>
            <p className="text-2xl font-bold text-emerald-400">{confirmedCount}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30 rounded-xl p-4">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Annulés</p>
            <p className="text-2xl font-bold text-red-400">{cancelledCount}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-white/5 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher par client, agent, téléphone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed]/50"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-[#7c3aed]/50 appearance-none cursor-pointer"
              >
                <option value="all" className="bg-[#1a1a2e]">Tous les statuts</option>
                <option value="pending" className="bg-[#1a1a2e]">En attente</option>
                <option value="confirmed" className="bg-[#1a1a2e]">Confirmés</option>
                <option value="cancelled" className="bg-[#1a1a2e]">Annulés</option>
                <option value="rescheduled" className="bg-[#1a1a2e]">Reprogrammés</option>
                <option value="nrp" className="bg-[#1a1a2e]">NRP</option>
                <option value="hc" className="bg-[#1a1a2e]">HC</option>
                <option value="not_interested" className="bg-[#1a1a2e]">Pas intéressé</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <select
                value={filterAgent}
                onChange={e => setFilterAgent(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-[#7c3aed]/50 appearance-none cursor-pointer"
              >
                <option value="all" className="bg-[#1a1a2e]">Tous les agents</option>
                {agents.map((a: any) => (
                  <option key={a.id} value={String(a.id)} className="bg-[#1a1a2e]">{a.name || a.username || `Agent #${a.id}`}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-[#7c3aed]/50 [color-scheme:dark]"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="text-[10px] text-gray-400 hover:text-white px-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">
              {filtered.length} rendez-vous
              {filterStatus !== 'all' && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${getStatusStyle(filterStatus).bg} ${getStatusStyle(filterStatus).text} ${getStatusStyle(filterStatus).border}`}>
                  {getStatusStyle(filterStatus).label}
                </span>
              )}
            </h3>
          </div>

          {filtered.length === 0 && (
            <div className="p-12 text-center">
              <Calendar className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-xs text-gray-500">Aucun rendez-vous trouvé</p>
            </div>
          )}

          <div className="divide-y divide-white/[0.03]">
            {filtered.map(apt => {
              const style = getStatusStyle(apt.status);
              const isExpanded = expandedId === apt.id;
              const isChanging = changingId === apt.id;

              return (
                <div key={apt.id} className="border-l-2 border-l-transparent hover:bg-white/[0.01] transition-colors"
                  style={{ borderLeftColor: apt.status === 'pending' ? '#f97316' : apt.status === 'confirmed' ? '#10b981' : apt.status === 'cancelled' ? '#ef4444' : apt.status === 'rescheduled' ? '#3b82f6' : '#6b7280' }}
                >
                  <div
                    className="flex items-center gap-4 px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : apt.id)}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-white truncate">{apt.client_name || 'Client inconnu'}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                          {style.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{apt.agent_name || 'Agent'}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{apt.client_phone || '-'}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{apt.appointment_date ? new Date(apt.appointment_date).toLocaleDateString('fr-FR') : '-'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-600">#{apt.id}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                        {apt.project_type && (
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Home className="w-3 h-3 text-gray-600" />{apt.project_type}
                          </div>
                        )}
                        {apt.chauffage && (
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Thermometer className="w-3 h-3 text-gray-600" />{apt.chauffage}
                          </div>
                        )}
                        {apt.revenus > 0 && (
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Banknote className="w-3 h-3 text-gray-600" />{apt.revenus}€
                          </div>
                        )}
                        {apt.appointment_time && (
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Clock className="w-3 h-3 text-gray-600" />{apt.appointment_time}
                          </div>
                        )}
                      </div>

                      {apt.notes && (
                        <div className="text-[10px] text-gray-500 bg-white/[0.02] rounded-lg p-2 border border-white/5">
                          {apt.notes}
                        </div>
                      )}

                      <div className="pt-2 border-t border-white/5">
                        <p className="text-[10px] text-gray-500 mb-2 font-medium uppercase tracking-wider">Changer le statut</p>
                        <div className="flex flex-wrap gap-2">
                          {ACTION_STATUSES.map(status => {
                            const s = getStatusStyle(status);
                            const isCurrent = apt.status === status;
                            return (
                              <button
                                key={status}
                                disabled={isCurrent || isChanging}
                                onClick={() => handleStatusChange(apt.id, status)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all
                                  ${isCurrent ? `${s.bg} ${s.text} ${s.border} opacity-60 cursor-default` : `${s.bg} ${s.text} ${s.border} hover:opacity-80`}
                                  disabled:opacity-40`}
                              >
                                {status === 'confirmed' && <CheckCircle className="w-3 h-3" />}
                                {status === 'cancelled' && <XCircle className="w-3 h-3" />}
                                {status === 'rescheduled' && <RefreshCw className="w-3 h-3" />}
                                {status === 'nrp' && <Phone className="w-3 h-3" />}
                                {status === 'hc' && <Phone className="w-3 h-3" />}
                                {status === 'not_interested' && <XCircle className="w-3 h-3" />}
                                {s.label}
                                {isCurrent && ' (actuel)'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
