interface TimerConfig {
  preparationTime: number; // secondi di preparazione
  recordingTime: number;   // secondi di registrazione
  processingTimeout: number; // timeout massimo analisi
}

interface TimerState {
  phase: 'idle' | 'preparing' | 'recording' | 'processing' | 'completed' | 'error';
  timeRemaining: number;
  totalTime: number;
  message: string;
}

class ExerciseTimerService {
  private config: TimerConfig = {
    preparationTime: 10,  // 10 secondi preparazione
    recordingTime: 8,     // 8 secondi registrazione
    processingTimeout: 180 // 3 minuti max per analisi
  };

  private currentTimer: NodeJS.Timeout | null = null;
  private callbacks: {
    onStateChange?: (state: TimerState) => void;
    onPhaseComplete?: (phase: string) => void;
    onError?: (error: string) => void;
  } = {};

  setCallbacks(callbacks: {
    onStateChange?: (state: TimerState) => void;
    onPhaseComplete?: (phase: string) => void;
    onError?: (error: string) => void;
  }) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  startExerciseSequence(exerciseName: string): Promise<{
    success: boolean;
    phase: string;
    timeElapsed: number;
  }> {
    return new Promise((resolve, reject) => {
      let sequenceStartTime = Date.now();
      
      // FASE 1: Preparazione (10 secondi)
      this.startPreparationPhase()
        .then(() => {
          this.callbacks.onPhaseComplete?.('preparation');
          
          // FASE 2: Registrazione (8 secondi)
          return this.startRecordingPhase();
        })
        .then(() => {
          this.callbacks.onPhaseComplete?.('recording');
          
          // FASE 3: Processing (max 3 minuti)
          return this.startProcessingPhase();
        })
        .then(() => {
          const totalTime = Date.now() - sequenceStartTime;
          this.callbacks.onPhaseComplete?.('processing');
          
          resolve({
            success: true,
            phase: 'completed',
            timeElapsed: Math.round(totalTime / 1000)
          });
        })
        .catch((error) => {
          this.callbacks.onError?.(error.message);
          reject(error);
        });
    });
  }

  private startPreparationPhase(): Promise<void> {
    return new Promise((resolve) => {
      let timeLeft = this.config.preparationTime;
      
      const updateState = () => {
        const state: TimerState = {
          phase: 'preparing',
          timeRemaining: timeLeft,
          totalTime: this.config.preparationTime,
          message: `Preparati! Inizia tra ${timeLeft} secondi...`
        };
        
        this.callbacks.onStateChange?.(state);
        
        if (timeLeft <= 0) {
          clearInterval(this.currentTimer!);
          resolve();
          return;
        }
        
        timeLeft--;
      };

      // Stato iniziale
      updateState();
      
      // Timer countdown
      this.currentTimer = setInterval(updateState, 1000);
    });
  }

  private startRecordingPhase(): Promise<void> {
    return new Promise((resolve) => {
      let timeLeft = this.config.recordingTime;
      
      const updateState = () => {
        const state: TimerState = {
          phase: 'recording',
          timeRemaining: timeLeft,
          totalTime: this.config.recordingTime,
          message: timeLeft > 0 ? `Registrazione in corso... ${timeLeft}s` : 'Registrazione completata!'
        };
        
        this.callbacks.onStateChange?.(state);
        
        if (timeLeft <= 0) {
          clearInterval(this.currentTimer!);
          resolve();
          return;
        }
        
        timeLeft--;
      };

      // Stato iniziale
      updateState();
      
      // Timer recording
      this.currentTimer = setInterval(updateState, 1000);
    });
  }

  private startProcessingPhase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let elapsed = 0;
      
      const updateState = () => {
        elapsed = Math.round((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, this.config.processingTimeout - elapsed);
        
        const state: TimerState = {
          phase: 'processing',
          timeRemaining: remaining,
          totalTime: this.config.processingTimeout,
          message: `Analisi in corso... ${elapsed}s`
        };
        
        this.callbacks.onStateChange?.(state);
        
        // Timeout check
        if (elapsed >= this.config.processingTimeout) {
          clearInterval(this.currentTimer!);
          reject(new Error('Processing timeout exceeded'));
          return;
        }
      };

      // Stato iniziale
      updateState();
      
      // Timer processing (aggiorna ogni 2 secondi)
      this.currentTimer = setInterval(updateState, 2000);
      
      // Simula completamento processing (in realtà sarà gestito dall'esterno)
      // Per ora risolviamo dopo 5 secondi per demo
      setTimeout(() => {
        if (this.currentTimer) {
          clearInterval(this.currentTimer);
          resolve();
        }
      }, 5000);
    });
  }

  stopTimer() {
    if (this.currentTimer) {
      clearInterval(this.currentTimer);
      this.currentTimer = null;
    }
  }

  updateConfig(newConfig: Partial<TimerConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): TimerConfig {
    return { ...this.config };
  }

  // Metodo per indicare che il processing è completato esternamente
  completeProcessing() {
    if (this.currentTimer) {
      clearInterval(this.currentTimer);
      this.currentTimer = null;
    }
    
    const state: TimerState = {
      phase: 'completed',
      timeRemaining: 0,
      totalTime: 0,
      message: 'Analisi completata!'
    };
    
    this.callbacks.onStateChange?.(state);
  }

  // Metodo per segnalare errore durante processing
  errorProcessing(errorMessage: string) {
    if (this.currentTimer) {
      clearInterval(this.currentTimer);
      this.currentTimer = null;
    }
    
    const state: TimerState = {
      phase: 'error',
      timeRemaining: 0,
      totalTime: 0,
      message: `Errore: ${errorMessage}`
    };
    
    this.callbacks.onStateChange?.(state);
  }
}

// WebSocket support per real-time updates
class TimerWebSocketService {
  private connections: Set<any> = new Set();
  
  addConnection(ws: any) {
    this.connections.add(ws);
    
    ws.on('close', () => {
      this.connections.delete(ws);
    });
  }

  broadcastTimerState(state: TimerState) {
    const message = JSON.stringify({
      type: 'timer_update',
      data: state,
      timestamp: new Date().toISOString()
    });

    this.connections.forEach(ws => {
      try {
        ws.send(message);
      } catch (error) {
        console.error('Error sending timer update:', error);
        this.connections.delete(ws);
      }
    });
  }

  broadcastPhaseComplete(phase: string) {
    const message = JSON.stringify({
      type: 'phase_complete',
      data: { phase },
      timestamp: new Date().toISOString()
    });

    this.connections.forEach(ws => {
      try {
        ws.send(message);
      } catch (error) {
        console.error('Error sending phase complete:', error);
        this.connections.delete(ws);
      }
    });
  }
}

export const exerciseTimerService = new ExerciseTimerService();
export const timerWebSocketService = new TimerWebSocketService();
export type { TimerConfig, TimerState };
