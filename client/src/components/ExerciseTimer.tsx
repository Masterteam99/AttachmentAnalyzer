import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Pause, 
  SkipForward, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Video, 
  Camera, 
  Eye,
  Brain,
  Activity,
  BarChart3
} from "lucide-react";

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

interface AnalysisResult {
  gpt_analysis: {
    score: number;
    feedback: string;
    corrections: string[];
  };
  pt_comparison: {
    score: number;
    similarity_percentage: number;
    key_differences: string[];
  };
  biomechanical_analysis: {
    score: number;
    violations: Array<{
      rule: string;
      severity: "low" | "medium" | "high";
      description: string;
    }>;
  };
  overall_score: number;
  summary: string;
  recommendations: string[];
}

interface TimerState {
  phase: 'idle' | 'preparing' | 'recording' | 'processing' | 'completed' | 'error';
  timeRemaining: number;
  totalTime: number;
  message: string;
}

interface ExerciseTimerProps {
  exercise: Exercise;
  onComplete: (analysisData: AnalysisResult) => void;
  onSkip: () => void;
  onCancel: () => void;
}

export default function ExerciseTimer({ 
  exercise, 
  onComplete, 
  onSkip, 
  onCancel 
}: ExerciseTimerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [timerState, setTimerState] = useState<TimerState>({
    phase: 'idle',
    timeRemaining: 0,
    totalTime: 0,
    message: 'Pronto per iniziare'
  });

  const [isActive, setIsActive] = useState(false);
  const [showVideoReference, setShowVideoReference] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timerState.phase !== 'completed' && timerState.phase !== 'error') {
      interval = setInterval(() => {
        updateTimer();
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timerState.phase]);

  const updateTimer = () => {
    setTimerState(prev => {
      if (prev.timeRemaining <= 0) {
        handlePhaseComplete(prev.phase);
        return prev;
      }

      return {
        ...prev,
        timeRemaining: prev.timeRemaining - 1
      };
    });
  };

  const handlePhaseComplete = async (phase: string) => {
    switch (phase) {
      case 'preparing':
        setTimerState({
          phase: 'recording',
          timeRemaining: exercise.duration_seconds,
          totalTime: exercise.duration_seconds,
          message: 'Registrazione in corso...'
        });
        break;
      case 'recording':
        setTimerState({
          phase: 'processing',
          timeRemaining: 0,
          totalTime: 0,
          message: 'Analisi in corso...'
        });
        await performAnalysis();
        break;
      case 'processing':
        setTimerState({
          phase: 'completed',
          timeRemaining: 0,
          totalTime: 0,
          message: 'Analisi completata!'
        });
        setIsActive(false);
        break;
    }
  };

  const performAnalysis = async () => {
    try {
      // Simula chiamata API per analisi tripla
      const response = await fetch('/api/movement-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exercise_id: exercise.id,
          exercise_name: exercise.name,
          duration: exercise.duration_seconds,
          // In produzione: dati video/keypoints
          video_data: "mock_video_data",
        }),
      });

      if (!response.ok) throw new Error('Analisi fallita');

      const result = await response.json();
      setAnalysisResult(result);
      
      setTimerState(prev => ({
        ...prev,
        phase: 'completed',
        message: 'Analisi completata!'
      }));
    } catch (error) {
      console.error('Errore durante l\'analisi:', error);
      setTimerState({
        phase: 'error',
        timeRemaining: 0,
        totalTime: 0,
        message: 'Errore durante l\'analisi'
      });
    }
  };

  const startTimer = () => {
    setTimerState({
      phase: 'preparing',
      timeRemaining: 10,
      totalTime: 10,
      message: 'Preparati per l\'esercizio...'
    });
    setIsActive(true);
  };

  const handleComplete = () => {
    if (analysisResult) {
      onComplete(analysisResult);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseIcon = () => {
    switch (timerState.phase) {
      case 'preparing':
        return <Clock className="h-6 w-6 text-yellow-600" />;
      case 'recording':
        return <Camera className="h-6 w-6 text-red-600" />;
      case 'processing':
        return <Brain className="h-6 w-6 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Play className="h-6 w-6 text-primary" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low": return "bg-yellow-100 text-yellow-800";
      case "medium": return "bg-orange-100 text-orange-800";
      case "high": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (timerState.phase === 'completed' && analysisResult) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Esercizio Completato: {exercise.name}
            </CardTitle>
            <CardDescription>
              Ecco l'analisi dettagliata della tua performance
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Analysis Results */}
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Riassunto</TabsTrigger>
            <TabsTrigger value="gpt">Analisi IA</TabsTrigger>
            <TabsTrigger value="pt">Confronto PT</TabsTrigger>
            <TabsTrigger value="biomech">Biomeccanica</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Punteggio Complessivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className={`text-4xl font-bold ${getScoreColor(analysisResult.overall_score)}`}>
                    {analysisResult.overall_score}/100
                  </div>
                  <p className="text-muted-foreground mt-2">{analysisResult.summary}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(analysisResult.gpt_analysis.score)}`}>
                      {analysisResult.gpt_analysis.score}
                    </div>
                    <div className="text-sm text-muted-foreground">Analisi IA</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(analysisResult.pt_comparison.score)}`}>
                      {analysisResult.pt_comparison.score}
                    </div>
                    <div className="text-sm text-muted-foreground">Confronto PT</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(analysisResult.biomechanical_analysis.score)}`}>
                      {analysisResult.biomechanical_analysis.score}
                    </div>
                    <div className="text-sm text-muted-foreground">Biomeccanica</div>
                  </div>
                </div>

                {analysisResult.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Raccomandazioni:</h4>
                    <ul className="space-y-1">
                      {analysisResult.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gpt" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Analisi IA ({analysisResult.gpt_analysis.score}/100)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{analysisResult.gpt_analysis.feedback}</p>
                {analysisResult.gpt_analysis.corrections.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Correzioni suggerite:</h4>
                    <ul className="space-y-1">
                      {analysisResult.gpt_analysis.corrections.map((correction, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          {correction}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pt" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Confronto PT ({analysisResult.pt_comparison.score}/100)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {analysisResult.pt_comparison.similarity_percentage}%
                  </div>
                  <p className="text-sm text-muted-foreground">Somiglianza con video PT</p>
                </div>
                
                {analysisResult.pt_comparison.key_differences.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Differenze principali:</h4>
                    <ul className="space-y-1">
                      {analysisResult.pt_comparison.key_differences.map((diff, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="w-1 h-1 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                          {diff}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="biomech" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Analisi Biomeccanica ({analysisResult.biomechanical_analysis.score}/100)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResult.biomechanical_analysis.violations.length > 0 ? (
                  <div className="space-y-3">
                    {analysisResult.biomechanical_analysis.violations.map((violation, index) => (
                      <div key={index} className="p-3 rounded-lg border">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityColor(violation.severity)}>
                            {violation.severity}
                          </Badge>
                          <span className="font-medium">{violation.rule}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{violation.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-green-600 font-medium">
                    ✅ Nessuna violazione biomeccanica rilevata. Ottima tecnica!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={handleComplete} className="flex-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Completa Esercizio
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Torna al Workout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Exercise Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{exercise.name}</span>
            <Badge variant={
              exercise.difficulty === "easy" ? "secondary" :
              exercise.difficulty === "medium" ? "default" : "destructive"
            }>
              {exercise.difficulty}
            </Badge>
          </CardTitle>
          <CardDescription>{exercise.description}</CardDescription>
        </CardHeader>
      </Card>

      {/* Video Reference and Timer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Reference */}
        {showVideoReference && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Video di Riferimento PT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                {exercise.video_reference ? (
                  <video
                    ref={videoRef}
                    src={`/api/video-pt/${exercise.id}`}
                    controls
                    className="w-full h-full object-cover rounded-lg"
                    poster="/api/video-pt/thumbnail.jpg"
                  >
                    Il tuo browser non supporta il tag video.
                  </video>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Video PT non disponibile</p>
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Durata:</strong> {exercise.duration_seconds}s</p>
                <p><strong>Muscoli:</strong> {exercise.muscle_groups.join(", ")}</p>
                <p><strong>Calorie:</strong> ~{exercise.calories_burn} cal</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timer Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getPhaseIcon()}
              Timer Esercizio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timerState.phase === 'idle' && (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Quando sei pronto, premi "Inizia" per il countdown di preparazione di 10 secondi.
                </p>
                <Button onClick={startTimer} size="lg" className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Inizia Esercizio
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onSkip} className="flex-1">
                    <SkipForward className="h-4 w-4 mr-2" />
                    Salta
                  </Button>
                  <Button variant="outline" onClick={onCancel} className="flex-1">
                    Annulla
                  </Button>
                </div>
              </div>
            )}

            {(timerState.phase === 'preparing' || timerState.phase === 'recording') && (
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold">
                  {formatTime(timerState.timeRemaining)}
                </div>
                <p className="text-muted-foreground">{timerState.message}</p>
                <Progress 
                  value={((timerState.totalTime - timerState.timeRemaining) / timerState.totalTime) * 100} 
                  className="h-2"
                />
              </div>
            )}

            {timerState.phase === 'processing' && (
              <div className="text-center space-y-4">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-muted-foreground">{timerState.message}</p>
                <p className="text-sm text-muted-foreground">
                  Stiamo analizzando la tua performance con IA, confronto PT e regole biomeccaniche...
                </p>
              </div>
            )}

            {timerState.phase === 'error' && (
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                <p className="text-red-600">{timerState.message}</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={startTimer} className="flex-1">
                    Riprova
                  </Button>
                  <Button variant="outline" onClick={onCancel} className="flex-1">
                    Annulla
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
