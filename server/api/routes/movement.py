from fastapi import APIRouter, Body
from server.services.fitness_analyzer.movement_analysis import (
    carica_regole_e_suggerimenti, verifica_regole_biomeccaniche,
    valutazione_openai, carica_keypoints_pt, confronto_con_pt, calcola_feedback_finale
)

router = APIRouter()

@router.post("/analizza_frame/")
async def analizza_frame(
    nome_esercizio: str = Body(...),
    keypoints: dict = Body(...)
):
    regole = carica_regole_e_suggerimenti(nome_esercizio)
    feedbacks_bio, score_bio = verifica_regole_biomeccaniche(keypoints, regole)
    feedback_ai, score_ai = valutazione_openai(keypoints, nome_esercizio)
    keypoints_pt = carica_keypoints_pt(nome_esercizio)
    feedback_pt, score_pt = confronto_con_pt(keypoints, keypoints_pt)
    score_finale = calcola_feedback_finale(score_ai, score_bio, score_pt)
    return {
        "score_finale": score_finale,
        "feedback_ai": feedback_ai,
        "feedback_bio": feedbacks_bio,
        "feedback_pt": feedback_pt
    }
