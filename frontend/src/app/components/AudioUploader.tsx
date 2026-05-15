/**
 * AudioUploader.tsx - Audio Upload & Analysis Component
 * Upload audio files for AI analysis
 */

import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface AnalysisResult {
  agent_name: string;
  transcription: string;
  sentiment: string;
  score_percentage: number;
  performance: string;
  summary: string;
  keywords: string[];
  score_ecoute: number;
  score_persuasion: number;
  score_empathie: number;
  score_argumentation: number;
  score_refus: number;
  score_vente: number;
}

const AudioUploader: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('audio/')) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Veuillez sélectionner un fichier audio (MP3, WAV, M4A)');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const analysisResult = await api.analyzeCall(file, user.username);
      setResult(analysisResult);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'analyse');
    } finally {
      setIsUploading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return 'text-green-600 bg-green-100';
      case 'NEGATIVE': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100 dark:bg-slate-800';
    }
  };

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'Excellent': return 'bg-green-500 text-white';
      case 'Bon': return 'bg-blue-500 text-white';
      case 'Moyen': return 'bg-yellow-500 text-white';
      default: return 'bg-red-500 text-white';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">Analyse d'Appel Audio</h2>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : file
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 dark:border-slate-600 hover:border-primary-500 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {file ? (
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="ml-4 text-gray-500 dark:text-gray-400 hover:text-red-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">Glissez-déposez un fichier audio ou cliquez pour sélectionner</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Formats supportés: MP3, WAV, M4A, OGG</p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}

      {/* Analyze Button */}
      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="mt-4 w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isUploading ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Analyse en cours...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.343-1.736-.945-2.347l-.548-.547z" />
            </svg>
            Lancer l'Analyse
          </>
        )}
      </button>

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Résultats de l'Analyse</h3>

          {/* Score Principal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-4xl font-bold text-primary-600">{result.score_percentage.toFixed(0)}%</p>
              <p className="text-sm text-gray-500">Score Global</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getPerformanceBadge(result.performance)}`}>
                {result.performance}
              </span>
              <p className="text-sm text-gray-500 mt-2">Performance</p>
            </div>
          </div>

          {/* Sentiment */}
          <div className={`p-4 rounded-lg ${getSentimentColor(result.sentiment)}`}>
            <p className="font-medium">Sentiment: {result.sentiment}</p>
          </div>

          {/* Detailed Scores */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Écoute', score: result.score_ecoute },
              { label: 'Persuasion', score: result.score_persuasion },
              { label: 'Empathie', score: result.score_empathie },
              { label: 'Argumentation', score: result.score_argumentation },
              { label: 'Gestion Refus', score: result.score_refus },
              { label: 'Vente', score: result.score_vente },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="font-semibold">{item.score}/10</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${item.score * 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Résumé</h4>
            <p className="text-blue-800 text-sm">{result.summary}</p>
          </div>

          {/* Keywords */}
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Mots-clés</h4>
            <div className="flex flex-wrap gap-2">
              {result.keywords.map((keyword, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Transcription */}
          <details className="bg-gray-50 rounded-lg">
            <summary className="p-4 cursor-pointer font-medium text-gray-700 dark:text-gray-300">
              Transcription complète
            </summary>
            <div className="p-4 pt-0 text-sm text-gray-600 whitespace-pre-wrap">
              {result.transcription}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default AudioUploader;