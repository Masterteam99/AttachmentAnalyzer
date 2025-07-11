import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar,
  SkipForward,
  Video,
  Info,
  Plus,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface DailyExercise {
  id: string;
  exerciseId: number;
  name: string;
  description: string;
  type: string;
  sets?: number;
  reps?: number;
  duration?: number;
  targetMuscles: string[];
  order: number;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  completedAt?: string;
  analysisResult?: any;
  formScore?: number;
  videoUrl?: string;
  instructions: string[];
  tips: string[];
}

interface DailyWorkout {
  id: string;
  userId: string;
  date: string;
  planId: number;
  exercises: DailyExercise[];
  totalExercises: number;
  completedExercises: number;
  estimatedDuration: number;
  actualDuration?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: string;
  createdAt: string;
}

interface WorkoutStats {
  weeklyWorkouts: number;
  totalDuration: number;
  averageScore: number;
  streak: number;
}

export default function DailyWorkoutDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch daily workout
  const { data: workout, isLoading, error } = useQuery({
    queryKey: ['daily-workout', selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/daily-workout/today`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch daily workout');
      return response.json() as Promise<DailyWorkout>;
    }
  });

  // Fetch workout stats
  const { data: stats } = useQuery({
    queryKey: ['workout-stats'],
    queryFn: async () => {
      const response = await fetch('/api/workout-stats?days=7', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch workout stats');
      return response.json() as Promise<WorkoutStats>;
    }
  });

  // Generate workout mutation
  const generateWorkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/daily-workout/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ date: selectedDate })
      });
      if (!response.ok) throw new Error('Failed to generate workout');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-workout'] });
      toast({
        title: "Workout Generato!",
        description: "Il tuo allenamento giornaliero è pronto"
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile generare l'allenamento",
        variant: "destructive"
      });
    }
  });

  // Start exercise navigation
  const handleStartExercise = () => {
    setLocation('/daily-workout');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completato</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-blue-500">In Corso</Badge>;
      case 'skipped':
        return <Badge variant="secondary">Saltato</Badge>;
      default:
        return <Badge variant="outline">In Attesa</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'active':
        return <Play className="h-5 w-5 text-blue-500" />;
      case 'skipped':
        return <SkipForward className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !workout) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <div className="space-y-2">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">Nessun workout per oggi</h3>
            <p className="text-muted-foreground">
              Non hai ancora un allenamento programmato per oggi.
            </p>
          </div>
          <Button 
            onClick={() => generateWorkoutMutation.mutate()}
            disabled={generateWorkoutMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            {generateWorkoutMutation.isPending ? "Generando..." : "Genera Workout"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Data</p>
                <p className="text-2xl font-bold">
                  {new Date(workout.date).toLocaleDateString('it-IT', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Esercizi</p>
                <p className="text-2xl font-bold">
                  {workout.completedExercises}/{workout.totalExercises}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Durata</p>
                <p className="text-2xl font-bold">
                  {formatDuration(workout.estimatedDuration)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Streak</p>
                <p className="text-2xl font-bold">
                  {stats?.streak || 0} giorni
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Progresso Workout</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Completamento</span>
              <span>{workout.completedExercises}/{workout.totalExercises} esercizi</span>
            </div>
            <Progress 
              value={(workout.completedExercises / workout.totalExercises) * 100} 
              className="h-2"
            />
            {workout.status === 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Workout Completato!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Ottimo lavoro! Hai completato tutti gli esercizi di oggi.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exercise List */}
      <Card>
        <CardHeader>
          <CardTitle>Esercizi di Oggi</CardTitle>
          <CardDescription>
            Clicca su un esercizio per iniziare il timer e l'analisi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workout.exercises.map((exercise, index) => (
              <div 
                key={exercise.id}
                className={`p-4 border rounded-lg ${
                  exercise.status === 'completed' ? 'bg-green-50 border-green-200' :
                  exercise.status === 'active' ? 'bg-blue-50 border-blue-200' :
                  'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(exercise.status)}
                    <div>
                      <h4 className="font-medium">{exercise.name}</h4>
                      <p className="text-sm text-muted-foreground">{exercise.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {exercise.duration && (
                          <Badge variant="outline" className="text-xs">
                            {exercise.duration}s
                          </Badge>
                        )}
                        {exercise.sets && exercise.reps && (
                          <Badge variant="outline" className="text-xs">
                            {exercise.sets}x{exercise.reps}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {exercise.targetMuscles.join(', ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(exercise.status)}
                    {exercise.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={handleStartExercise}
                        className="ml-2"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Inizia
                      </Button>
                    )}
                    {exercise.formScore && (
                      <Badge variant="outline">
                        Score: {exercise.formScore}/100
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Exercise Details */}
                {exercise.instructions.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium mb-1">Istruzioni:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {exercise.instructions.map((instruction, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={handleStartExercise}
          disabled={workout.status === 'completed'}
          className="flex-1"
        >
          <Play className="h-4 w-4 mr-2" />
          {workout.status === 'completed' ? 'Workout Completato' : 'Inizia Workout'}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => generateWorkoutMutation.mutate()}
          disabled={generateWorkoutMutation.isPending}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Rigenera
        </Button>
      </div>

      {/* Weekly Stats (if available) */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Statistiche Settimanali</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.weeklyWorkouts}</div>
                <div className="text-sm text-muted-foreground">Workout</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(stats.totalDuration / 60)}m
                </div>
                <div className="text-sm text-muted-foreground">Tempo Totale</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.averageScore}</div>
                <div className="text-sm text-muted-foreground">Score Medio</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.streak}</div>
                <div className="text-sm text-muted-foreground">Giorni Consecutivi</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
