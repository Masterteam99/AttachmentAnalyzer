"""
Node.js Bridge Client for ML Services

This TypeScript client handles communication between the main Node.js app
and the Python ML services via HTTP API calls.
"""

interface MLAnalysisRequest {
  exercise_name: string;
  keypoints: Array<{[key: string]: number}>;
  user_id: string;
  session_id?: string;
}

interface MLAnalysisResponse {
  form_score: number;
  feedback: string;
  corrections: string[];
  strengths: string[];
  confidence: number;
  timestamp: string;
}

interface PoseDetectionRequest {
  video_data: string;
  exercise_type: string;
}

interface PoseDetectionResponse {
  keypoints: Array<{[key: string]: number}>;
  confidence: number;
  frame_count: number;
}

class MLBridgeClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'http://localhost:8001', timeout: number = 30000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  async analyzeMovement(request: MLAnalysisRequest): Promise<MLAnalysisResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze-movement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`ML Service error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to analyze movement:', error);
      throw new Error(`ML Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async detectPose(request: PoseDetectionRequest): Promise<PoseDetectionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/detect-pose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`ML Service error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to detect pose:', error);
      throw new Error(`Pose detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async trainCustomModel(exerciseType: string, trainingData: any[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/train-model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exercise_type: exerciseType,
          training_data: trainingData
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`ML Service error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to train model:', error);
      throw new Error(`Model training failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      return response.ok;
    } catch (error) {
      console.error('ML Service health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const mlBridge = new MLBridgeClient(
  process.env.ML_SERVICE_URL || 'http://localhost:8001',
  parseInt(process.env.ML_SERVICE_TIMEOUT || '30000')
);

export type {
  MLAnalysisRequest,
  MLAnalysisResponse,
  PoseDetectionRequest,
  PoseDetectionResponse
};
