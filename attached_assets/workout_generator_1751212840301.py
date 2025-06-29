from typing import List, Dict, Any, Optional
from enum import Enum
from datetime import datetime, timedelta
from ..models.database import database
from ..config.settings import settings

class ExerciseType(str, Enum):
    STRENGTH = "strength"
    CARDIO = "cardio"
    FLEXIBILITY = "flexibility"

class WorkoutGenerator:
    async def get_user_plans(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Ottiene tutti i piani di allenamento dell'utente.
        
        Args:
            user_id: ID dell'utente
            
        Returns:
            Lista di piani di allenamento
        """
        plans = await database.fetch_all(
            """
            SELECT id, name, description, created_at, is_active
            FROM workout_plans
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            """,
            {"user_id": user_id}
        )
        
        return [dict(plan) for plan in plans]
    
    async def generate_weekly_plan(self, user_id: int, plan_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Genera un nuovo piano di allenamento settimanale personalizzato.
        
        Args:
            user_id: ID dell'utente
            plan_data: Dati per la generazione del piano
            
        Returns:
            Piano di allenamento generato
        """
        # Ottieni informazioni utente
        user = await database.fetch_one(
            "SELECT fitness_level, goals FROM users WHERE id = :user_id",
            {"user_id": user_id}
        )
        
        fitness_level = user["fitness_level"] if user else 1
        goals = user["goals"].split(",") if user and user["goals"] else []
        
        # Crea nuovo piano
        plan_id = await database.execute(
            """
            INSERT INTO workout_plans (user_id, name, description, created_at, is_active)
            VALUES (:user_id, :name, :description, :created_at, :is_active)
            RETURNING id
            """,
            {
                "user_id": user_id,
                "name": plan_data.get("name", "Piano Settimanale"),
                "description": plan_data.get("description", "Piano di allenamento personalizzato"),
                "created_at": datetime.now(),
                "is_active": True
            }
        )
        
        # Determina focus areas basate su obiettivi
        focus_areas = self._determine_focus_areas(goals)
        
        # Genera esercizi per ogni giorno
        for day in range(7):
            # Salta giorni di riposo (es. giorno 0 e 4)
            if day == 0 or day == 4:
                continue
                
            # Determina tipo di allenamento per il giorno
            if day in [1, 5]:
                workout_type = ExerciseType.STRENGTH
            elif day in [2, 6]:
                workout_type = ExerciseType.CARDIO
            else:
                workout_type = ExerciseType.FLEXIBILITY
            
            # Seleziona esercizi per il giorno
            exercises = self._select_exercises(workout_type, 3, fitness_level, focus_areas)
            
            # Salva esercizi nel database
            for i, exercise in enumerate(exercises):
                await database.execute(
                    """
                    INSERT INTO workout_exercises 
                    (plan_id, name, description, type, difficulty, target_muscles, day, "order")
                    VALUES (:plan_id, :name, :description, :type, :difficulty, :target_muscles, :day, :order)
                    """,
                    {
                        "plan_id": plan_id,
                        "name": exercise["name"],
                        "description": exercise["description"],
                        "type": exercise["type"],
                        "difficulty": exercise["difficulty"],
                        "target_muscles": ",".join(exercise["target_muscles"]),
                        "day": day,
                        "order": i
                    }
                )
        
        # Restituisci piano completo
        return await self.get_plan_details(plan_id, user_id)
    
    async def get_plan_details(self, plan_id: int, user_id: int) -> Dict[str, Any]:
        """
        Ottiene i dettagli di un piano di allenamento specifico.
        
        Args:
            plan_id: ID del piano
            user_id: ID dell'utente
            
        Returns:
            Dettagli del piano di allenamento
        """
        # Verifica che il piano appartenga all'utente
        plan = await database.fetch_one(
            """
            SELECT id, name, description, created_at, is_active
            FROM workout_plans
            WHERE id = :plan_id AND user_id = :user_id
            """,
            {"plan_id": plan_id, "user_id": user_id}
        )
        
        if not plan:
            raise ValueError("Piano non trovato o non autorizzato")
        
        # Ottieni esercizi del piano
        exercises = await database.fetch_all(
            """
            SELECT id, name, description, type, difficulty, target_muscles, day, "order"
            FROM workout_exercises
            WHERE plan_id = :plan_id
            ORDER BY day, "order"
            """,
            {"plan_id": plan_id}
        )
        
        # Organizza esercizi per giorno
        days = {}
        for exercise in exercises:
            day = exercise["day"]
            if day not in days:
                days[day] = []
            
            # Converti target_muscles da stringa a lista
            target_muscles = exercise["target_muscles"].split(",") if exercise["target_muscles"] else []
            
            days[day].append({
                "id": exercise["id"],
                "name": exercise["name"],
                "description": exercise["description"],
                "type": exercise["type"],
                "difficulty": exercise["difficulty"],
                "target_muscles": target_muscles,
                "order": exercise["order"]
            })
        
        # Crea risultato
        result = dict(plan)
        result["days"] = days
        result["created_at"] = result["created_at"].isoformat()
        
        return result
    
    async def update_plan(self, plan_id: int, plan_data: Dict[str, Any], user_id: int) -> Dict[str, Any]:
        """
        Aggiorna un piano di allenamento esistente.
        
        Args:
            plan_id: ID del piano
            plan_data: Nuovi dati del piano
            user_id: ID dell'utente
            
        Returns:
            Piano aggiornato
        """
        # Verifica che il piano appartenga all'utente
        plan = await database.fetch_one(
            """
            SELECT id FROM workout_plans
            WHERE id = :plan_id AND user_id = :user_id
            """,
            {"plan_id": plan_id, "user_id": user_id}
        )
        
        if not plan:
            raise ValueError("Piano non trovato o non autorizzato")
        
        # Aggiorna piano
        await database.execute(
            """
            UPDATE workout_plans
            SET name = :name, description = :description, is_active = :is_active
            WHERE id = :plan_id
            """,
            {
                "plan_id": plan_id,
                "name": plan_data.get("name"),
                "description": plan_data.get("description"),
                "is_active": plan_data.get("is_active", True)
            }
        )
        
        # Aggiorna esercizi se presenti
        if "exercises" in plan_data:
            # Elimina esercizi esistenti
            await database.execute(
                "DELETE FROM workout_exercises WHERE plan_id = :plan_id",
                {"plan_id": plan_id}
            )
            
            # Inserisci nuovi esercizi
            for day, exercises in plan_data["exercises"].items():
                for i, exercise in enumerate(exercises):
                    await database.execute(
                        """
                        INSERT INTO workout_exercises 
                        (plan_id, name, description, type, difficulty, target_muscles, day, "order")
                        VALUES (:plan_id, :name, :description, :type, :difficulty, :target_muscles, :day, :order)
                        """,
                        {
                            "plan_id": plan_id,
                            "name": exercise["name"],
                            "description": exercise.get("description", ""),
                            "type": exercise["type"],
                            "difficulty": exercise.get("difficulty", 1),
                            "target_muscles": ",".join(exercise.get("target_muscles", [])),
                            "day": int(day),
                            "order": i
                        }
                    )
        
        # Restituisci piano aggiornato
        return await self.get_plan_details(plan_id, user_id)
    
    async def delete_plan(self, plan_id: int, user_id: int) -> None:
        """
        Elimina un piano di allenamento.
        
        Args:
            plan_id: ID del piano
            user_id: ID dell'utente
        """
        # Verifica che il piano appartenga all'utente
        plan = await database.fetch_one(
            """
            SELECT id FROM workout_plans
            WHERE id = :plan_id AND user_id = :user_id
            """,
            {"plan_id": plan_id, "user_id": user_id}
        )
        
        if not plan:
            raise ValueError("Piano non trovato o non autorizzato")
        
        # Elimina esercizi
        await database.execute(
            "DELETE FROM workout_exercises WHERE plan_id = :plan_id",
            {"plan_id": plan_id}
        )
        
        # Elimina piano
        await database.execute(
            "DELETE FROM workout_plans WHERE id = :plan_id",
            {"plan_id": plan_id}
        )
    
    def _determine_focus_areas(self, goals: List[str]) -> List[str]:
        """
        Determina le aree di focus basate sugli obiettivi dell'utente.
        
        Args:
            goals: Obiettivi dell'utente
            
        Returns:
            Aree di focus
        """
        focus_areas = []
        
        # Mappa obiettivi a gruppi muscolari
        goal_to_muscles = {
            "perdere_peso": ["cardio", "full_body"],
            "aumentare_forza": ["chest", "back", "legs"],
            "migliorare_resistenza": ["cardio", "core"],
            "tonificare": ["full_body", "core"],
            "flessibilità": ["flexibility"]
        }
        
        # Aggiungi aree di focus basate su obiettivi
        for goal in goals:
            if goal in goal_to_muscles:
                focus_areas.extend(goal_to_muscles[goal])
        
        # Se non ci sono obiettivi, usa un approccio bilanciato
        if not focus_areas:
            focus_areas = ["full_body", "cardio", "core"]
        
        return list(set(focus_areas))  # Rimuovi duplicati
    
    def _select_exercises(self, workout_type: ExerciseType, count: int, fitness_level: int, focus_areas: List[str]) -> List[Dict[str, Any]]:
        """
        Seleziona esercizi per un allenamento.
        
        Args:
            workout_type: Tipo di allenamento
            count: Numero di esercizi da selezionare
            fitness_level: Livello di fitness dell'utente
            focus_areas: Aree di focus
            
        Returns:
            Lista di esercizi
        """
        # Database di esercizi (in una versione reale, questo sarebbe nel database)
        exercise_database = {
            ExerciseType.STRENGTH: [
                {
                    "name": "Push-up",
                    "description": "Esercizio per pettorali, tricipiti e spalle",
                    "difficulty": 2,
                    "target_muscles": ["chest", "triceps", "shoulders"]
                },
                {
                    "name": "Squat",
                    "description": "Esercizio per gambe e glutei",
                    "difficulty": 2,
                    "target_muscles": ["legs", "glutes"]
                },
                {
                    "name": "Plank",
                    "description": "Esercizio per core e stabilità",
                    "difficulty": 1,
                    "target_muscles": ["core", "shoulders"]
                },
                {
                    "name": "Lunges",
                    "description": "Esercizio per gambe e equilibrio",
                    "difficulty": 2,
                    "target_muscles": ["legs", "glutes", "core"]
                },
                {
                    "name": "Pull-up",
                    "description": "Esercizio per schiena e bicipiti",
                    "difficulty": 3,
                    "target_muscles": ["back", "biceps"]
                }
            ],
            ExerciseType.CARDIO: [
                {
                    "name": "Corsa",
                    "description": "Cardio ad alto impatto",
                    "difficulty": 2,
                    "target_muscles": ["cardio", "legs"]
                },
                {
                    "name": "Jumping Jacks",
                    "description": "Esercizio cardio a corpo libero",
                    "difficulty": 1,
                    "target_muscles": ["cardio", "full_body"]
                },
                {
                    "name": "Burpees",
                    "description": "Esercizio cardio ad alta intensità",
                    "difficulty": 3,
                    "target_muscles": ["cardio", "full_body"]
                },
                {
                    "name": "Mountain Climbers",
                    "description": "Esercizio cardio per core e resistenza",
                    "difficulty": 2,
                    "target_muscles": ["cardio", "core"]
                }
            ],
            ExerciseType.FLEXIBILITY: [
                {
                    "name": "Stretching Gambe",
                    "description": "Allungamento per flessibilità delle gambe",
                    "difficulty": 1,
                    "target_muscles": ["flexibility", "legs"]
                },
                {
                    "name": "Yoga - Posizione del Cane",
                    "description": "Posizione yoga per flessibilità generale",
                    "difficulty": 2,
                    "target_muscles": ["flexibility", "full_body"]
                },
                {
                    "name": "Stretching Schiena",
                    "description": "Allungamento per flessibilità della schiena",
                    "difficulty": 1,
                    "target_muscles": ["flexibility", "back"]
                }
            ]
        }
        
        # Filtra esercizi per tipo e difficoltà
        available_exercises = [
            ex for ex in exercise_database.get(workout_type, [])
            if ex["difficulty"] <= fitness_level + 1  # Permetti esercizi leggermente più difficili
        ]
        
        # Prioritizza esercizi che corrispondono alle aree di focus
        prioritized_exercises = []
        other_exercises = []
        
        for exercise in available_exercises:
            if any(area in exercise["target_muscles"] for area in focus_areas):
                prioritized_exercises.append(exercise)
            else:
                other_exercises.append(exercise)
        
        # Seleziona esercizi
        selected = []
        remaining_count = count
        
        # Prima dagli esercizi prioritizzati
        while prioritized_exercises and remaining_count > 0:
            # In una versione reale, qui ci sarebbe una selezione più sofisticata
            selected.append(prioritized_exercises.pop(0))
            remaining_count -= 1
        
        # Se necessario, aggiungi altri esercizi
        while other_exercises and remaining_count > 0:
            selected.append(other_exercises.pop(0))
            remaining_count -= 1
        
        return selected
