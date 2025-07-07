import React, { useState } from 'react';
import { inviaRisultatiWorkout } from '../services/workoutEvaluationService';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

type WorkoutSummaryProps = {
  risultatiEsercizi: number[];
};

const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({ risultatiEsercizi }) => {
  const [percentuale, setPercentuale] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valutaWorkout = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!risultatiEsercizi || risultatiEsercizi.length === 0) {
        setError('Nessun risultato da valutare.');
        setLoading(false);
        return;
      }
      const perc = await inviaRisultatiWorkout(risultatiEsercizi);
      setPercentuale(perc);
    } catch (e) {
      setError('Errore durante la valutazione. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-4 p-4 border rounded-lg bg-white shadow">
      <h2 className="text-xl font-bold mb-2">Riepilogo Workout</h2>
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {percentuale !== null && !error && (
        <Alert variant="default" className="mb-2">
          <AlertTitle>Percentuale di correttezza</AlertTitle>
          <AlertDescription>
            <strong className="text-lg">{percentuale}%</strong>
          </AlertDescription>
        </Alert>
      )}
      <button
        onClick={valutaWorkout}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Calcolo in corso...' : 'Calcola percentuale'}
      </button>
    </div>
  );
};

export default WorkoutSummary;
