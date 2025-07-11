import os
import pandas as pd
import openai
import logging
from typing import Dict, List, Tuple, Any

openai.api_key = os.getenv("OPENAI_API_KEY", "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")
if not openai.api_key:
    raise RuntimeError("La chiave API OpenAI non è configurata. Impostare la variabile d'ambiente OPENAI_API_KEY.")

def carica_regole_e_suggerimenti(nome_esercizio: str) -> List[Dict[str, Any]]:
    """Carica le regole biomeccaniche e suggerimenti per un esercizio specifico."""
    try:
        df = pd.read_excel('regole_biomeccaniche.xlsx')
        regole = df[df['esercizio'] == nome_esercizio]
        return regole.to_dict('records')
    except Exception as e:
        logging.error(f"Errore caricamento regole: {e}")
        return []

def verifica_regole_biomeccaniche(keypoints: dict, regole: list) -> Tuple[List[Dict[str, Any]], float]:
    """Verifica i keypoints rispetto alle regole biomeccaniche e restituisce feedback e score."""
    feedbacks = []
    errori = 0
    for regola in regole:
        valore = keypoints.get(regola.get('articolazione'), 0)
        condizione = regola.get('condizione')
        limite = regola.get('limite')
        if condizione == '>' and valore > limite:
            feedbacks.append({
                "errore": regola.get('errore'),
                "descrizione": regola.get('descrizione_errore'),
                "suggerimento": regola.get('suggerimento')
            })
            errori += 1
        elif condizione == '<' and valore < limite:
            feedbacks.append({
                "errore": regola.get('errore'),
                "descrizione": regola.get('descrizione_errore'),
                "suggerimento": regola.get('suggerimento')
            })
            errori += 1
    score = 1.0 if errori == 0 else max(0, 1 - errori / max(1, len(regole)))
    return feedbacks, score

def valutazione_openai(keypoints: dict, nome_esercizio: str) -> Tuple[str, float]:
    """Valuta l'esercizio tramite OpenAI e restituisce feedback e score."""
    prompt = (
        f"Valuta la correttezza dell'esecuzione dell'esercizio '{nome_esercizio}' "
        f"dati questi keypoints: {keypoints}. Restituisci un punteggio da 0 a 1 e un breve feedback. "
        f"Rispondi nel formato: 'Punteggio: <valore>. Feedback: <testo>'"
    )
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        testo = response.choices[0].message['content']
        score = 0.5
        for part in testo.split(". "):
            if part.strip().lower().startswith("punteggio:"):
                try:
                    score = float(part.split(":")[1].strip().replace(",", "."))
                except Exception:
                    score = 0.5
        feedback = testo
    except Exception as e:
        logging.error(f"Errore OpenAI: {e}")
        feedback = "Valutazione AI non disponibile."
        score = 0.5
    return feedback, score

def carica_keypoints_pt(nome_esercizio: str) -> Dict[str, float]:
    """Carica i keypoints medi del PT da file/database (stub)."""
    # TODO: implementare caricamento reale
    return {}

def confronto_con_pt(keypoints_utente: dict, keypoints_pt: dict) -> Tuple[str, float]:
    """Confronta i keypoints utente con quelli del PT e restituisce feedback e score."""
    if not keypoints_pt:
        return "Nessun riferimento PT disponibile.", 0.5
    differenze = [abs(keypoints_utente[k] - keypoints_pt.get(k, 0)) for k in keypoints_utente]
    if not differenze:
        return "Dati insufficienti per il confronto.", 0.5
    media_diff = sum(differenze) / len(differenze)
    if media_diff < 10:
        return "Ottima corrispondenza con il PT.", 1.0
    elif media_diff < 20:
        return "Buona, ma puoi migliorare la precisione.", 0.7
    else:
        return "Differenza significativa rispetto al PT.", 0.4

def calcola_feedback_finale(score_ai: float, score_bio: float, score_pt: float) -> float:
    """Calcola lo score finale pesato."""
    return round(score_ai * 0.33 + score_bio * 0.34 + score_pt * 0.33, 2)
