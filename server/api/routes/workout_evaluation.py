from fastapi import APIRouter, Body, HTTPException
from server.services.fitness_analyzer.workout_evaluation import calcola_percentuale_workout

router = APIRouter()

@router.post("/valuta_workout/")
async def valuta_workout(
    risultati_esercizi: list = Body(...)
):
    if not isinstance(risultati_esercizi, list) or not risultati_esercizi:
        raise HTTPException(status_code=400, detail="Lista risultati_esercizi mancante o vuota")
    try:
        percentuale = calcola_percentuale_workout(risultati_esercizi)
        return {"percentuale_correttezza": percentuale}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore valutazione workout: {e}")
