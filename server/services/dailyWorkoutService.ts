interface DailyWorkout {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  planId: number;
  exercises: DailyExercise[];
  totalExercises: number;
  completedExercises: number;
  estimatedDuration: number; // minuti
  actualDuration?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: string;
  createdAt: string;
}

interface DailyExercise {
  id: string;
  exerciseId: number;
  name: string;
  description: string;
  type: string;
  sets?: number;
  reps?: number;
  duration?: number; // secondi
  targetMuscles: string[];
  order: number;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  completedAt?: string;
  analysisResult?: any;
  formScore?: number;
  videoUrl?: string; // URL video PT reference
  instructions: string[];
  tips: string[];
}

interface WorkoutProgress {
  currentExerciseIndex: number;
  totalExercises: number;
  progressPercentage: number;
  timeElapsed: number;
  estimatedTimeRemaining: number;
}

class DailyWorkoutService {
  private storage: any;
  
  constructor(storage: any) {
    this.storage = storage;
  }

  // Genera workout giornaliero per un utente
  async generateDailyWorkout(userId: string, date: string = new Date().toISOString().split('T')[0]): Promise<DailyWorkout> {
    try {
      // Verifica se esiste già un workout per oggi
      const existingWorkout = await this.getDailyWorkout(userId, date);
      if (existingWorkout) {
        return existingWorkout;
      }

      // Ottieni il piano attivo dell'utente
      const userPlans = await this.storage.getUserWorkoutPlans(userId);
      const activePlan = userPlans.find((plan: any) => plan.isActive) || userPlans[0];
      
      if (!activePlan) {
        throw new Error('No active workout plan found for user');
      }

      // Ottieni esercizi del piano
      const planExercises = await this.storage.getExercisesByPlan(activePlan.id);
      
      // Determina esercizi per oggi (basato su day della settimana)
      const today = new Date(date);
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const todayExercises = planExercises.filter((ex: any) => 
        ex.day === dayOfWeek || ex.day === null // null = every day
      );

      // Converti in DailyExercise format
      const exercises: DailyExercise[] = await Promise.all(
        todayExercises.map(async (ex: any, index: number) => {
          // Ottieni video reference per l'esercizio
          const { videoReferenceService } = await import('./videoReferenceService');
          const videoRef = await videoReferenceService.getVideoReference(ex.name);
          
          return {
            id: `${ex.id}_${date}`,
            exerciseId: ex.id,
            name: ex.name,
            description: ex.description || '',
            type: ex.type,
            sets: ex.sets,
            reps: ex.reps,
            duration: ex.duration,
            targetMuscles: ex.targetMuscles ? ex.targetMuscles.split(',') : [],
            order: index,
            status: 'pending',
            videoUrl: videoRef?.videoUrl,
            instructions: videoRef?.instructions || [],
            tips: videoRef?.tips || []
          };
        })
      );

      // Calcola durata stimata
      const estimatedDuration = exercises.reduce((total, ex) => {
        return total + (ex.duration || 60); // default 60 secondi per esercizio
      }, 0) / 60; // converti in minuti

      const dailyWorkout: DailyWorkout = {
        id: `${userId}_${date}`,
        userId,
        date,
        planId: activePlan.id,
        exercises,
        totalExercises: exercises.length,
        completedExercises: 0,
        estimatedDuration: Math.round(estimatedDuration),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Salva nel database (usando una tabella temporanea o cache)
      await this.saveDailyWorkout(dailyWorkout);
      
      return dailyWorkout;
    } catch (error) {
      console.error('Error generating daily workout:', error);
      throw new Error('Failed to generate daily workout: ' + (error as Error).message);
    }
  }

  // Ottieni workout giornaliero
  async getDailyWorkout(userId: string, date: string = new Date().toISOString().split('T')[0]): Promise<DailyWorkout | null> {
    try {
      // Per ora usiamo un sistema di cache in memoria
      // In produzione questo andrebbe in database
      const workoutId = `${userId}_${date}`;
      
      // Cerca nel cache/database
      const cached = await this.loadDailyWorkout(workoutId);
      return cached;
    } catch (error) {
      console.error('Error getting daily workout:', error);
      return null;
    }
  }

  // Avvia un esercizio specifico
  async startExercise(userId: string, exerciseId: string, date: string = new Date().toISOString().split('T')[0]): Promise<{
    exercise: DailyExercise;
    timerConfig: any;
    workoutProgress: WorkoutProgress;
  }> {
    try {
      const workout = await this.getDailyWorkout(userId, date);
      if (!workout) {
        throw new Error('No daily workout found');
      }

      const exercise = workout.exercises.find(ex => ex.id === exerciseId);
      if (!exercise) {
        throw new Error('Exercise not found in daily workout');
      }

      // Aggiorna stato esercizio
      exercise.status = 'active';
      workout.status = 'in_progress';

      // Salva aggiornamenti
      await this.saveDailyWorkout(workout);

      // Calcola progress
      const progress = this.calculateProgress(workout);

      // Configura timer
      const { exerciseTimerService } = await import('./exerciseTimerService');
      const timerConfig = exerciseTimerService.getConfig();

      return {
        exercise,
        timerConfig,
        workoutProgress: progress
      };
    } catch (error) {
      console.error('Error starting exercise:', error);
      throw new Error('Failed to start exercise: ' + (error as Error).message);
    }
  }

  // Completa un esercizio
  async completeExercise(
    userId: string, 
    exerciseId: string, 
    analysisResult: any,
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<{
    workout: DailyWorkout;
    nextExercise?: DailyExercise;
    workoutProgress: WorkoutProgress;
  }> {
    try {
      const workout = await this.getDailyWorkout(userId, date);
      if (!workout) {
        throw new Error('No daily workout found');
      }

      const exercise = workout.exercises.find(ex => ex.id === exerciseId);
      if (!exercise) {
        throw new Error('Exercise not found');
      }

      // Aggiorna esercizio
      exercise.status = 'completed';
      exercise.completedAt = new Date().toISOString();
      exercise.analysisResult = analysisResult;
      exercise.formScore = analysisResult.formScore;

      // Aggiorna contatori workout
      workout.completedExercises = workout.exercises.filter(ex => ex.status === 'completed').length;

      // Verifica se workout è completato
      if (workout.completedExercises === workout.totalExercises) {
        workout.status = 'completed';
        workout.completedAt = new Date().toISOString();
        
        // Calcola durata effettiva
        const startTime = new Date(workout.createdAt);
        const endTime = new Date();
        workout.actualDuration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      }

      // Trova prossimo esercizio
      const nextExercise = workout.exercises.find(ex => ex.status === 'pending');

      // Salva aggiornamenti
      await this.saveDailyWorkout(workout);

      // Calcola progress
      const progress = this.calculateProgress(workout);

      return {
        workout,
        nextExercise,
        workoutProgress: progress
      };
    } catch (error) {
      console.error('Error completing exercise:', error);
      throw new Error('Failed to complete exercise: ' + (error as Error).message);
    }
  }

  // Salta un esercizio
  async skipExercise(userId: string, exerciseId: string, reason?: string): Promise<DailyWorkout> {
    try {
      const workout = await this.getDailyWorkout(userId);
      if (!workout) {
        throw new Error('No daily workout found');
      }

      const exercise = workout.exercises.find(ex => ex.id === exerciseId);
      if (!exercise) {
        throw new Error('Exercise not found');
      }

      exercise.status = 'skipped';
      exercise.completedAt = new Date().toISOString();

      await this.saveDailyWorkout(workout);
      return workout;
    } catch (error) {
      console.error('Error skipping exercise:', error);
      throw new Error('Failed to skip exercise: ' + (error as Error).message);
    }
  }

  // Ottieni statistiche workout
  async getWorkoutStats(userId: string, days: number = 7): Promise<{
    totalWorkouts: number;
    completedWorkouts: number;
    completionRate: number;
    averageScore: number;
    totalExercises: number;
    completedExercises: number;
    recentWorkouts: DailyWorkout[];
  }> {
    try {
      // Per ora calcolo su workout recenti (in produzione query database)
      const recentWorkouts: DailyWorkout[] = [];
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const workout = await this.getDailyWorkout(userId, dateStr);
        if (workout) {
          recentWorkouts.push(workout);
        }
      }

      const totalWorkouts = recentWorkouts.length;
      const completedWorkouts = recentWorkouts.filter(w => w.status === 'completed').length;
      const completionRate = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;

      const totalExercises = recentWorkouts.reduce((sum, w) => sum + w.totalExercises, 0);
      const completedExercises = recentWorkouts.reduce((sum, w) => sum + w.completedExercises, 0);

      // Calcola score medio
      const allScores = recentWorkouts
        .flatMap(w => w.exercises)
        .filter(ex => ex.formScore !== undefined)
        .map(ex => ex.formScore!);
      
      const averageScore = allScores.length > 0 
        ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length 
        : 0;

      return {
        totalWorkouts,
        completedWorkouts,
        completionRate: Math.round(completionRate),
        averageScore: Math.round(averageScore),
        totalExercises,
        completedExercises,
        recentWorkouts
      };
    } catch (error) {
      console.error('Error getting workout stats:', error);
      throw new Error('Failed to get workout stats');
    }
  }

  private calculateProgress(workout: DailyWorkout): WorkoutProgress {
    const currentExerciseIndex = workout.exercises.findIndex(ex => ex.status === 'active');
    const progressPercentage = (workout.completedExercises / workout.totalExercises) * 100;
    
    // Calcola tempo trascorso
    const startTime = new Date(workout.createdAt);
    const timeElapsed = Math.round((Date.now() - startTime.getTime()) / (1000 * 60)); // minuti

    // Stima tempo rimanente
    const remainingExercises = workout.totalExercises - workout.completedExercises;
    const estimatedTimeRemaining = Math.round(remainingExercises * (workout.estimatedDuration / workout.totalExercises));

    return {
      currentExerciseIndex: Math.max(0, currentExerciseIndex),
      totalExercises: workout.totalExercises,
      progressPercentage: Math.round(progressPercentage),
      timeElapsed,
      estimatedTimeRemaining
    };
  }

  private async saveDailyWorkout(workout: DailyWorkout): Promise<void> {
    // Per ora usa file system come cache
    // In produzione salvare in database
    const fs = await import('fs');
    const path = await import('path');
    
    const cacheDir = path.join(process.cwd(), 'server/cache/daily_workouts');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const filePath = path.join(cacheDir, `${workout.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(workout, null, 2));
  }

  private async loadDailyWorkout(workoutId: string): Promise<DailyWorkout | null> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const filePath = path.join(process.cwd(), 'server/cache/daily_workouts', `${workoutId}.json`);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading daily workout:', error);
      return null;
    }
  }
}

export { DailyWorkoutService };
export type { DailyWorkout, DailyExercise, WorkoutProgress };
