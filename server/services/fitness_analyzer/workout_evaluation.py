import logging

def calcola_percentuale_workout(risultati_esercizi):
    """Calcola la percentuale media di correttezza del workout."""
    try:
        if not risultati_esercizi or not isinstance(risultati_esercizi, list):
            return 0
        percentuale = sum(risultati_esercizi) / len(risultati_esercizi) * 100
        return round(percentuale, 1)
    except Exception as e:
        logging.error(f"Errore calcolo percentuale workout: {e}")
        return 0
