import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Phone, PhoneOff, Pause, Play, Volume2, Mic, MicOff, User, Building, Mail, MapPin, Phone as PhoneIcon, MessageSquare, Bot, Save } from 'lucide-react';
import { saveCall, type SaveCallRequest } from '../../services/api';

interface Contact {
  id: number;
  company: string;
  contact: string;
  role: string;
  phone: string;
  email: string;
  city: string;
}

const fullTranscription = [
  { id: 1, speaker: 'Agent', text: 'Bonjour, je suis Sarah de EBI Call Center. Puis-je parler à M. Dupont ?', triggerTime: 2, sentiment: 'positive' },
  { id: 2, speaker: 'Client', text: 'Oui, c\'est moi. De quoi s\'agit-il ?', triggerTime: 6, sentiment: 'neutral' },
  { id: 3, speaker: 'Agent', text: 'Je vous appelle suite à votre demande de devis pour nos services de téléphonie et de centre d\'appels.', triggerTime: 12, sentiment: 'positive' },
  { id: 4, speaker: 'Client', text: 'Ah oui, c\'est exact. Je cherche à équiper mon équipe commerciale.', triggerTime: 18, sentiment: 'positive' },
  { id: 5, speaker: 'Agent', text: 'Parfait. Avez-vous déjà un budget estimé pour ce projet d\'équipement ?', triggerTime: 24, sentiment: 'neutral' },
  { id: 6, speaker: 'Client', text: 'Je dirais autour de 5000€ pour commencer.', triggerTime: 30, sentiment: 'positive' },
  { id: 7, speaker: 'Agent', text: 'C\'est noté. Je vous propose qu\'on planifie une démonstration mardi prochain ?', triggerTime: 36, sentiment: 'positive' },
  { id: 8, speaker: 'Client', text: 'Oui, mardi matin me conviendrait bien.', triggerTime: 42, sentiment: 'positive' }
];

export default function ContactPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const contactState = location.state as { contact?: Contact; autoStart?: boolean } | null;
  const contact = contactState?.contact;
  const autoStart = contactState?.autoStart || false;

  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [callSaved, setCallSaved] = useState(false);
  
  // AI Simulation State
  const [visibleMessages, setVisibleMessages] = useState<typeof fullTranscription>([]);
  const [besoin, setBesoin] = useState("Non défini");
  const [budget, setBudget] = useState("");
  const [interet, setInteret] = useState("");
  const [notes, setNotes] = useState("");
  const [animatingField, setAnimatingField] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (callActive && !isPaused) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval !== undefined) {
        clearInterval(interval);
      }
    };
  }, [callActive, isPaused]);

  useEffect(() => {
    if (autoStart && contact && !callActive) {
      setCallActive(true);
      setCallDuration(0);
      setVisibleMessages([]);
      setBesoin("Non défini");
      setBudget("");
      setInteret("");
      setNotes("");
      setIsPaused(false);
    }
  }, []);

  useEffect(() => {
    if (!callActive && callDuration > 0 && !callSaved && contact) {
      handleSaveCall();
    }
  }, [callActive]);

  // AI Logic Simulation Hook
  useEffect(() => {
    if (callActive && !isPaused) {
      const message = fullTranscription.find(m => m.triggerTime === callDuration);
      if (message) {
        setVisibleMessages(prev => [...prev, message]);
        
        // Auto-scroll to bottom of transcription
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
        
        // Real-time Form filling AI
        if (message.triggerTime === 12) {
          setBesoin("Centre d'appels");
          setAnimatingField('besoin');
          setTimeout(() => setAnimatingField(null), 2500);
        } else if (message.triggerTime === 18) {
          setInteret("Élevé");
          setAnimatingField('interet');
          setTimeout(() => setAnimatingField(null), 2500);
        } else if (message.triggerTime === 30) {
          setBudget("5000€");
          setAnimatingField('budget');
          setTimeout(() => setAnimatingField(null), 2500);
        } else if (message.triggerTime === 42) {
          setNotes("Client très intéressé. Démo planifiée pour mardi matin.");
          setAnimatingField('notes');
          setTimeout(() => setAnimatingField(null), 2500);
        }
      }
    }
  }, [callDuration, callActive, isPaused]);

  const handleStartCall = () => {
    setCallActive(true);
    setCallDuration(0);
    setVisibleMessages([]);
    setBesoin("Non défini");
    setBudget("");
    setInteret("");
    setNotes("");
    setIsPaused(false);
  };

  const handleEndCall = () => {
    setCallActive(false);
    setIsPaused(false);
  };

  const handleSaveCall = async () => {
    if (!contact || callSaved) return;
    
    setCallSaved(true);
    
    const callData: SaveCallRequest = {
      contact_id: contact.id,
      contact_name: contact.contact,
      contact_company: contact.company,
      phone: contact.phone,
      email: contact.email,
      duration: callDuration,
      besoin: besoin,
      budget: budget,
      interet: interet,
      notes: notes,
      statut: 'Rappel',
      call_date: new Date().toISOString(),
    };

    try {
      await saveCall(callData);
      console.log('Appel sauvegardé avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }

    setTimeout(() => {
      navigate('/agent/contacts');
    }, 1500);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-foreground">Appel en cours</h3>
                <p className="text-sm text-muted-foreground">{contact?.phone || '+33 6 12 34 56 78'}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                callActive && !isPaused ? 'bg-success/10 text-success animate-pulse' : 
                callActive && isPaused ? 'bg-warning/10 text-warning' : 
                'bg-muted text-muted-foreground'
              }`}>
                {callActive && !isPaused ? 'En ligne' : callActive && isPaused ? 'En pause' : 'En attente'}
              </div>
            </div>

            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className={`w-32 h-32 rounded-full ${callActive ? 'bg-gradient-to-br from-primary to-secondary' : 'bg-muted'} flex items-center justify-center transition-all duration-500`}>
                  <Phone className="w-16 h-16 text-white" />
                </div>
                {callActive && !isPaused && (
                  <div className="absolute inset-0 rounded-full animate-ping bg-primary opacity-20 duration-1000"></div>
                )}
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-4xl font-medium text-foreground">{formatDuration(callDuration)}</p>
            </div>

            <div className="flex items-center justify-center gap-3">
              {!callActive ? (
                <button
                  onClick={handleStartCall}
                  className="bg-success hover:bg-success/90 text-success-foreground p-4 rounded-full transition-colors shadow-lg hover:shadow-success/20"
                >
                  <Phone className="w-6 h-6" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="bg-warning hover:bg-warning/90 text-warning-foreground p-4 rounded-full transition-colors"
                  >
                    {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="bg-muted hover:bg-muted/80 text-foreground p-4 rounded-full transition-colors"
                  >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                  <button className="bg-muted hover:bg-muted/80 text-foreground p-4 rounded-full transition-colors">
                    <Volume2 className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleEndCall}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground p-4 rounded-full transition-colors shadow-lg hover:shadow-destructive/20"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 flex flex-col" style={{ minHeight: '400px' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h3>Transcription IA en direct</h3>
              </div>
              {callActive && !isPaused && (
                <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Analyse en cours...
                </div>
              )}
            </div>
            
            <div 
              ref={scrollRef}
              className="space-y-4 overflow-y-auto pr-2 flex-grow scroll-smooth" 
              style={{ maxHeight: '350px' }}
            >
              {visibleMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                  Démarrez l'appel pour lancer l'analyse en temps réel.
                </div>
              ) : (
                visibleMessages.map((item) => (
                  <div key={item.id} className={`p-3 rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                    item.speaker === 'Agent' ? 'bg-primary/20 ml-8 border border-primary/20' : 'bg-muted mr-8'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-foreground flex items-center gap-2">
                         {item.speaker} {item.speaker === 'Agent' && <Bot className="w-3 h-3 text-primary"/>}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDuration(item.triggerTime)}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
                    <div className="mt-2">
                      <span className={`px-2 py-0.5 rounded text-xs border ${
                        item.sentiment === 'positive' ? 'bg-success/10 text-success border-success/20' :
                        item.sentiment === 'negative' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                        'bg-muted/50 text-muted-foreground border-border'
                      }`}>
                        {item.sentiment === 'positive' ? '😊 Positif' : item.sentiment === 'negative' ? '😞 Négatif' : '😐 Neutre'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="mb-4">Informations du Contact</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Building className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Société</p>
                  <p className="text-foreground">{contact?.company || 'Société ABC SAS'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <User className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</p>
                  <p className="text-foreground font-medium">{contact?.contact || 'Jean Dupont'}</p>
                  <p className="text-sm text-muted-foreground">{contact?.role || 'Directeur Commercial'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Phone className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Téléphone</p>
                  <p className="text-foreground">{contact?.phone || '+33 6 12 34 56 78'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Mail className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</p>
                  <p className="text-foreground">{contact?.email || 'email@exemple.fr'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ville</p>
                  <p className="text-foreground">{contact?.city || 'Paris'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 relative overflow-hidden">
            {callActive && (
              <div className="absolute top-0 right-0 p-4 opacity-10 hidden md:block pointer-events-none">
                 <Bot className="w-32 h-32 text-primary" />
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-6">
              <Bot className="w-5 h-5 text-primary" />
              <h3>CRM Assisté par l'IA</h3>
            </div>
            
            <form className="space-y-5 relative z-10">
              <div>
                <label className="flex items-center justify-between text-sm mb-2 text-foreground font-medium">
                   Besoin identifié
                   {animatingField === 'besoin' && <span className="text-xs text-primary animate-pulse flex items-center gap-1"><Bot className="w-3 h-3"/> Détecté !</span>}
                </label>
                <select 
                  value={besoin}
                  onChange={(e) => setBesoin(e.target.value)}
                  className={`w-full px-3 py-2.5 bg-card border rounded-lg focus:outline-none focus:ring-2 transition-all duration-500 ${
                    animatingField === 'besoin' ? 'border-primary ring-2 ring-primary ring-opacity-50 shadow-[0_0_15px_rgba(108,92,231,0.5)]' : 'border-border focus:ring-ring'
                  }`}
                >
                  <option>Non défini</option>
                  <option>Téléphonie d'entreprise</option>
                  <option>Centre d'appels</option>
                  <option>Standard virtuel</option>
                  <option>Autre</option>
                </select>
              </div>

              <div>
                <label className="flex items-center justify-between text-sm mb-2 text-foreground font-medium">
                  Budget estimé
                  {animatingField === 'budget' && <span className="text-xs text-success animate-pulse flex items-center gap-1"><Bot className="w-3 h-3"/> Extrait !</span>}
                </label>
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Ex: 5000€"
                  className={`w-full px-3 py-2.5 bg-card border rounded-lg focus:outline-none focus:ring-2 transition-all duration-500 ${
                    animatingField === 'budget' ? 'border-primary ring-2 ring-primary ring-opacity-50 shadow-[0_0_15px_rgba(108,92,231,0.5)] text-success font-semibold' : 'border-border focus:ring-ring'
                  }`}
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-sm mb-2 text-foreground font-medium">
                  Niveau d'intérêt
                  {animatingField === 'interet' && <span className="text-xs text-warning animate-pulse flex items-center gap-1"><Bot className="w-3 h-3"/> Analysé !</span>}
                </label>
                <div className="flex gap-2">
                  {['Faible', 'Moyen', 'Élevé', 'Très élevé'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setInteret(level)}
                      className={`flex-1 px-2 py-2 border rounded-lg transition-all duration-300 text-sm font-medium ${
                        interet === level 
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105' 
                          : 'border-border text-foreground hover:border-primary hover:text-primary'
                      } ${animatingField === 'interet' && level === interet ? 'ring-2 ring-primary ring-offset-2 ring-offset-card animate-pulse' : ''}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between text-sm mb-2 text-foreground font-medium">
                  Résumé Automatique
                  {animatingField === 'notes' && <span className="text-xs text-primary animate-pulse flex items-center gap-1"><Bot className="w-3 h-3"/> Généré !</span>}
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="L'IA générera des notes ici..."
                  className={`w-full px-3 py-2.5 bg-card border rounded-lg focus:outline-none focus:ring-2 transition-all duration-500 resize-none ${
                    animatingField === 'notes' ? 'border-primary ring-2 ring-primary shadow-[0_0_15px_rgba(108,92,231,0.5)]' : 'border-border focus:ring-ring'
                  }`}
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  className="flex-1 px-4 py-2.5 bg-success text-success-foreground rounded-lg hover:bg-success/90 transition-all shadow hover:shadow-lg font-medium"
                >
                  Converti
                </button>
                <button
                  type="button"
                  className="flex-1 px-4 py-2.5 bg-warning text-warning-foreground rounded-lg hover:bg-warning/90 transition-all shadow hover:shadow-lg font-medium"
                >
                  Rappel
                </button>
                <button
                  type="button"
                  className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-all shadow hover:shadow-lg font-medium"
                >
                  Refusé
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
