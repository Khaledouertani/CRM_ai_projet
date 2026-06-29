import React, { useState, useEffect } from 'react';
import { Save, AlertTriangle, Clock, Target, Users } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

interface Weights {
  ecoute: number;
  persuasion: number;
  empathie: number;
  argumentation: number;
  refus: number;
  vente: number;
}

interface Alerts {
  min_score: number;
  max_inactivity_minutes: number;
  min_conversion_rate: number;
  alert_email: string;
  alert_enabled: boolean;
}

export default function ScoringConfigPage() {
  const [weights, setWeights] = useState<Weights>({
    ecoute: 20,
    persuasion: 20,
    empathie: 15,
    argumentation: 15,
    refus: 15,
    vente: 15
  });

  const [alerts, setAlerts] = useState<Alerts>({
    min_score: 70,
    max_inactivity_minutes: 15,
    min_conversion_rate: 40,
    alert_email: 'admin@crm.local',
    alert_enabled: true
  });

  const [totalWeight, setTotalWeight] = useState(100);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    setTotalWeight(total);
  }, [weights]);

  const handleWeightChange = (key: keyof Weights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (totalWeight !== 100) {
      setSaveMessage('La somme des pondérations doit être égale à 100%');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      const response = await fetch('/api/config/weights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights, alerts })
      });

      if (response.ok) {
        setSaveMessage('Configuration enregistrée avec succès!');
      } else {
        setSaveMessage('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      setSaveMessage('Erreur de connexion');
    } finally {
      setIsSaving(false);
    }
  };

  const criteriaLabels: Record<keyof Weights, string> = {
    ecoute: 'Écoute active',
    persuasion: 'Persuasion',
    empathie: 'Empathie',
    argumentation: 'Argumentation',
    refus: 'Gestion des refus',
    vente: 'Conclusion de la vente'
  };

  const alertTypes = [
    { key: 'min_score', label: 'Score minimum', icon: Target, suffix: '%' },
    { key: 'max_inactivity_minutes', label: 'Inactivité max', icon: Clock, suffix: ' min' },
    { key: 'min_conversion_rate', label: 'Conversion minimum', icon: Users, suffix: '%' }
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h2>Configuration du Scoring</h2>
        <p className="text-muted-foreground mt-1">
          Définissez les pondérations et les seuils d'alertes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Pondérations des critères
            </CardTitle>
            <CardDescription>
              Somme actuelle: <span className={totalWeight === 100 ? 'text-green-500' : 'text-red-500'}>
                {totalWeight}%
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(Object.keys(weights) as Array<keyof Weights>).map(key => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label>{criteriaLabels[key]}</label>
                  <span className="font-medium">{weights[key]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights[key]}
                  onChange={e => handleWeightChange(key, parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            ))}

            {totalWeight !== 100 && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                La somme doit être exactement 100%
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Seuils d'alertes
            </CardTitle>
            <CardDescription>
              Notifications déclenchées lorsque les seuils sont atteints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {alertTypes.map(({ key, label, icon: Icon, suffix }) => (
              <div key={key} className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <Icon className="w-4 h-4" />
                  {label}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={alerts[key as keyof Alerts] as number}
                    onChange={e => setAlerts(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                    className="w-24 dark:text-white dark:bg-slate-900 font-bold"
                  />
                  <span className="text-muted-foreground text-sm">{suffix}</span>
                </div>
              </div>
            ))}

            <div className="space-y-2 pt-4 border-t">
              <label className="text-sm">Email de notification</label>
              <Input
                type="email"
                value={alerts.alert_email}
                onChange={e => setAlerts(prev => ({ ...prev, alert_email: e.target.value }))}
                className="dark:text-white dark:bg-slate-900 font-bold"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="alert_enabled"
                checked={alerts.alert_enabled}
                onChange={e => setAlerts(prev => ({ ...prev, alert_enabled: e.target.checked }))}
                className="w-4 h-4"
              />
              <label htmlFor="alert_enabled" className="text-sm">
                Activer les alertes
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={isSaving || totalWeight !== 100}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>

        {saveMessage && (
          <span className={saveMessage.includes('succès') ? 'text-green-500' : 'text-red-500'}>
            {saveMessage}
          </span>
        )}
      </div>
    </div>
  );
}