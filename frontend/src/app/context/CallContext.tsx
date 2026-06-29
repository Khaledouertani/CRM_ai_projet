import React, { createContext, useState, useCallback, ReactNode } from 'react';

// Types for a field value with source and confidence
export interface FieldValue {
  value: string;
  source: 'AI' | 'Manual' | 'Default';
  confidence: number; // 0-100
}

export interface CRMSection {
  [key: string]: FieldValue;
}

export interface CRMData {
  identity: CRMSection;
  housing: CRMSection;
  energy: CRMSection;
  financing: CRMSection;
  motivation: CRMSection;
}

export interface CallContextProps {
  transcription: string;
  setTranscription: (t: string) => void;
  crmData: CRMData;
  setCRMData: (data: CRMData) => void;
  missingAlerts: string[];
  setMissingAlerts: (alerts: string[]) => void;
}

const defaultField = { value: '', source: 'Default' as const, confidence: 0 };

const defaultCRMData: CRMData = {
  identity: {
    nom: { ...defaultField },
    prenom: { ...defaultField },
    telephone: { ...defaultField },
    email: { ...defaultField },
    adresse: { ...defaultField },
    ville: { ...defaultField },
    code_postal: { ...defaultField },
  },
  housing: {
    proprietaire: { ...defaultField },
    annee_acquisition: { ...defaultField },
    type_logement: { ...defaultField },
    surface_habitation: { ...defaultField },
    nombre_occupants: { ...defaultField },
    residence_principale: { ...defaultField },
  },
  energy: {
    mode_chauffage: { ...defaultField },
    facture_chauffage_annuelle: { ...defaultField },
    age_chaudiere: { ...defaultField },
    marque_chaudiere: { ...defaultField },
    panneaux_photovoltaiques: { ...defaultField },
    pac: { ...defaultField },
    etat_toiture: { ...defaultField },
    orientation_toiture: { ...defaultField },
    surface_toiture: { ...defaultField },
    isolation: { ...defaultField },
    double_vitrage: { ...defaultField },
    dpe: { ...defaultField },
  },
  financing: {
    profession_monsieur: { ...defaultField },
    profession_madame: { ...defaultField },
    revenus_mensuels: { ...defaultField },
    credits_en_cours: { ...defaultField },
    mensualites_credits: { ...defaultField },
    fichage_bancaire: { ...defaultField },
    eligibilite_financement: { ...defaultField },
  },
  motivation: {
    raison_projet: { ...defaultField },
    urgence_projet: { ...defaultField },
    budget_estime: { ...defaultField },
    niveau_interet: { ...defaultField },
    devis_deja_fait: { ...defaultField },
    objections: { ...defaultField },
  },
};

export const CallContext = createContext<CallContextProps | undefined>(undefined);

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const [transcription, setTranscription] = useState('');
  const [crmData, setCRMData] = useState<CRMData>(defaultCRMData);
  const [missingAlerts, setMissingAlerts] = useState<string[]>([]);

  const setTranscriptionCallback = useCallback((t: string) => {
    setTranscription(t);
    // TODO: send to backend for extraction and update crmData + missingAlerts
  }, []);

  const contextValue: CallContextProps = {
    transcription,
    setTranscription: setTranscriptionCallback,
    crmData,
    setCRMData,
    missingAlerts,
    setMissingAlerts,
  };

  return <CallContext.Provider value={contextValue}>{children}</CallContext.Provider>;
};
