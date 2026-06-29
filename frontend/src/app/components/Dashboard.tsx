/**
 * Dashboard.tsx - Main Dashboard Component
 * Displays stats, charts, and quick actions
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Stats {
  total_calls: number;
  avg_score: number;
  sentiment_distribution: Record<string, number>;
  performance_distribution: Record<string, number>;
  role: string;
}

interface AgentSummary {
  agent_name: string;
  total_calls: number;
  avg_score: number;
  positive_calls: number;
  negative_calls: number;
}

const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [agentsData, setAgentsData] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    if (isAdmin) {
      loadAgentsData();
    }
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAgentsData = async () => {
    try {
      const data = await api.getAgentsCallsSummary();
      setAgentsData(data);
    } catch (error) {
      console.error('Failed to load agents data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-gray-900 dark:text-white">
        <h1 className="text-2xl font-bold">
          Bienvenue, {user?.name || user?.username} 
        </h1>
        <p className="text-gray-900 dark:text-white/80 mt-2">
          {isAdmin
            ? 'Vue d\'ensemble de votre centre d\'appels'
            : 'Vos performances du jour'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Calls */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Appels</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-200 mt-1">{stats?.total_calls || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Score Moyen</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-200 mt-1">
                {stats?.avg_score?.toFixed(1) || '0'}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Positive Calls */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Appels Positifs</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-200 mt-1">
                {stats?.sentiment_distribution?.POSITIVE || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Negative Calls */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Appels Négatifs</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-200 mt-1">
                {stats?.sentiment_distribution?.NEGATIVE || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Only: Agents Table */}
      {isAdmin && agentsData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Performance par Agent</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Agent</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Appels</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Score Moyen</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Positifs</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Négatifs</th>
                </tr>
              </thead>
              <tbody>
                {agentsData.map((agent) => (
                  <tr key={agent.agent_name} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{agent.agent_name}</td>
                    <td className="text-center py-3 px-4">{agent.total_calls}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        agent.avg_score >= 70 ? 'bg-green-100 text-green-700' :
                        agent.avg_score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {agent.avg_score.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4 text-green-600">{agent.positive_calls}</td>
                    <td className="text-center py-3 px-4 text-red-600">{agent.negative_calls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Analyse Audio</h3>
          <p className="text-sm text-gray-500 mb-4">Analysez un nouvel appel avec l'IA</p>
          <button className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Nouvelle Analyse
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Chatbot IA</h3>
          <p className="text-sm text-gray-500 mb-4">Posez des questions sur vos données</p>
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Ouvrir le Chatbot
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Historique</h3>
          <p className="text-sm text-gray-500 mb-4">Consultez vos appels analysés</p>
          <button className="w-full py-2 bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-700 transition-colors">
            Voir l'Historique
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;