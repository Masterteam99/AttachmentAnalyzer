import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, CheckCircle, SkipForward, Trophy, Calendar } from "lucide-react";
import DailyWorkoutDashboard from "@/components/DailyWorkoutDashboard";
import ExerciseTimer from "@/components/ExerciseTimer";
import NavigationSidebar from "@/components/NavigationSidebar";
import { useQuery } from "@tanstack/react-query";

interface Exercise {
  id: string;
  name: string;
  description: string;
  duration_seconds: number;
  muscle_groups: string[];
  difficulty: "easy" | "medium" | "hard";
  calories_burn: number;
  video_reference?: string;
}

interface WorkoutSession {
  id: string;
  date: string;
  exercises: Exercise[];
  total_exercises: number;
  completed_exercises: number;
  estimated_duration: number;
  total_calories: number;
  status: "not_started" | "in_progress" | "completed";
}

export default function DailyWorkout() {
  const [, setLocation] = useLocation();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Fetch daily workout data
  const { data: workout, isLoading, refetch } = useQuery<WorkoutSession>({
    queryKey: ["/api/daily-workout/today"],
    queryFn: async () => {
      const response = await fetch("/api/daily-workout/today");
      if (!response.ok) throw new Error("Failed to fetch daily workout");
      return response.json();
    },
  });

  const handleStartExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsTimerActive(true);
  };

  const handleCompleteExercise = async (exerciseId: string, analysisData?: any) => {
    try {
      const response = await fetch(`/api/daily-workout/exercise/${exerciseId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis_data: analysisData }),
      });
      
      if (!response.ok) throw new Error("Failed to complete exercise");
      
      // Refresh workout data
      await refetch();
      
      // Reset timer state
      setSelectedExercise(null);
      setIsTimerActive(false);
    } catch (error) {
      console.error("Error completing exercise:", error);
    }
  };

  const handleSkipExercise = async (exerciseId: string) => {
    try {
      const response = await fetch(`/api/daily-workout/exercise/${exerciseId}/skip`, {
        method: "POST",
      });
      
      if (!response.ok) throw new Error("Failed to skip exercise");
      
      // Refresh workout data
      await refetch();
      
      // Reset timer state
      setSelectedExercise(null);
      setIsTimerActive(false);
    } catch (error) {
      console.error("Error skipping exercise:", error);
    }
  };

  const handleTimerCancel = () => {
    setSelectedExercise(null);
    setIsTimerActive(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <NavigationSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Caricamento allenamento giornaliero...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show timer interface when exercise is selected
  if (isTimerActive && selectedExercise) {
    return (
      <div className="flex h-screen">
        <NavigationSidebar />
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={handleTimerCancel}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna al workout
            </Button>
            
            <ExerciseTimer
              exercise={selectedExercise}
              onComplete={(analysisData) => handleCompleteExercise(selectedExercise.id, analysisData)}
              onSkip={() => handleSkipExercise(selectedExercise.id)}
              onCancel={handleTimerCancel}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <NavigationSidebar />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Allenamento Giornaliero</h1>
              <p className="text-muted-foreground">
                {workout ? new Date(workout.date).toLocaleDateString("it-IT", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                }) : "Oggi"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>

          {workout ? (
            <>
              {/* Workout Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Panoramica Workout
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{workout.total_exercises}</div>
                      <div className="text-sm text-muted-foreground">Esercizi Totali</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{workout.completed_exercises}</div>
                      <div className="text-sm text-muted-foreground">Completati</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{Math.round(workout.estimated_duration / 60)}min</div>
                      <div className="text-sm text-muted-foreground">Durata Stimata</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{workout.total_calories}</div>
                      <div className="text-sm text-muted-foreground">Calorie</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span>{workout.completed_exercises}/{workout.total_exercises} esercizi</span>
                    </div>
                    <Progress 
                      value={(workout.completed_exercises / workout.total_exercises) * 100} 
                      className="h-2"
                    />
                  </div>

                  {workout.status === "completed" && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-800">
                        <Trophy className="h-5 w-5" />
                        <span className="font-medium">Workout Completato!</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Ottimo lavoro! Hai completato tutti gli esercizi di oggi.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Exercises List */}
              <Card>
                <CardHeader>
                  <CardTitle>Esercizi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workout.exercises.map((exercise, index) => {
                      const isCompleted = index < workout.completed_exercises;
                      const isCurrent = index === workout.completed_exercises && workout.status !== "completed";
                      
                      return (
                        <div
                          key={exercise.id}
                          className={`p-4 rounded-lg border transition-all ${
                            isCompleted
                              ? "bg-green-50 border-green-200"
                              : isCurrent
                              ? "bg-blue-50 border-blue-200 ring-2 ring-blue-100"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">{index + 1}. {exercise.name}</span>
                                {isCompleted && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                                <Badge variant={
                                  exercise.difficulty === "easy" ? "secondary" :
                                  exercise.difficulty === "medium" ? "default" : "destructive"
                                }>
                                  {exercise.difficulty}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {exercise.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{exercise.duration_seconds}s</span>
                                <span>{exercise.calories_burn} cal</span>
                                <span>{exercise.muscle_groups.join(", ")}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {!isCompleted && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSkipExercise(exercise.id)}
                                    disabled={!isCurrent}
                                  >
                                    <SkipForward className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() => handleStartExercise(exercise)}
                                    disabled={!isCurrent}
                                    size="sm"
                                  >
                                    <Play className="h-4 w-4 mr-1" />
                                    Inizia
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <DailyWorkoutDashboard />
          )}
        </div>
      </div>
    </div>
  );
}
