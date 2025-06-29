import { analyzeMovementForm } from "./openai";

interface KeyPoint {
  x: number;
  y: number;
  visibility: number;
}

interface PoseData {
  keypoints: KeyPoint[];
  timestamp: number;
}

class MovementAnalysisService {
  async analyzeMovement(exerciseName: string, videoData: string): Promise<{
    formScore: number;
    feedback: string;
    corrections: string[];
    strengths: string[];
    keypoints?: any[];
  }> {
    try {
      // In a real implementation, this would process the video data using MediaPipe
      // and extract pose keypoints. For now, we'll simulate the keypoint extraction
      const simulatedKeypoints = this.simulateKeypointExtraction(videoData);
      
      // Analyze the movement using OpenAI
      const analysis = await analyzeMovementForm(exerciseName, simulatedKeypoints);
      
      return {
        ...analysis,
        keypoints: simulatedKeypoints
      };
    } catch (error) {
      console.error("Error in movement analysis:", error);
      throw new Error("Failed to analyze movement: " + (error as Error).message);
    }
  }

  private simulateKeypointExtraction(videoData: string): PoseData[] {
    // This simulates MediaPipe pose detection results
    // In a real implementation, you would:
    // 1. Decode the video data
    // 2. Process each frame with MediaPipe
    // 3. Extract pose keypoints
    // 4. Return the keypoint data
    
    const simulatedFrames: PoseData[] = [];
    const frameCount = 30; // Simulate 30 frames
    
    for (let i = 0; i < frameCount; i++) {
      const keypoints: KeyPoint[] = [
        // Simulate key body landmarks (MediaPipe pose landmarks)
        { x: 0.5 + Math.random() * 0.1 - 0.05, y: 0.2 + Math.random() * 0.05, visibility: 0.9 }, // Head
        { x: 0.45 + Math.random() * 0.1 - 0.05, y: 0.35 + Math.random() * 0.05, visibility: 0.8 }, // Left shoulder
        { x: 0.55 + Math.random() * 0.1 - 0.05, y: 0.35 + Math.random() * 0.05, visibility: 0.8 }, // Right shoulder
        { x: 0.4 + Math.random() * 0.1 - 0.05, y: 0.5 + Math.random() * 0.05, visibility: 0.7 }, // Left elbow
        { x: 0.6 + Math.random() * 0.1 - 0.05, y: 0.5 + Math.random() * 0.05, visibility: 0.7 }, // Right elbow
        { x: 0.35 + Math.random() * 0.1 - 0.05, y: 0.65 + Math.random() * 0.05, visibility: 0.6 }, // Left wrist
        { x: 0.65 + Math.random() * 0.1 - 0.05, y: 0.65 + Math.random() * 0.05, visibility: 0.6 }, // Right wrist
        { x: 0.48 + Math.random() * 0.04 - 0.02, y: 0.7 + Math.random() * 0.05, visibility: 0.9 }, // Left hip
        { x: 0.52 + Math.random() * 0.04 - 0.02, y: 0.7 + Math.random() * 0.05, visibility: 0.9 }, // Right hip
        { x: 0.47 + Math.random() * 0.06 - 0.03, y: 0.85 + Math.random() * 0.05, visibility: 0.8 }, // Left knee
        { x: 0.53 + Math.random() * 0.06 - 0.03, y: 0.85 + Math.random() * 0.05, visibility: 0.8 }, // Right knee
        { x: 0.46 + Math.random() * 0.08 - 0.04, y: 0.95 + Math.random() * 0.03, visibility: 0.7 }, // Left ankle
        { x: 0.54 + Math.random() * 0.08 - 0.04, y: 0.95 + Math.random() * 0.03, visibility: 0.7 }, // Right ankle
      ];
      
      simulatedFrames.push({
        keypoints,
        timestamp: i * 33.33 // 30 FPS = 33.33ms per frame
      });
    }
    
    return simulatedFrames;
  }

  async validateExerciseForm(exerciseName: string, keypoints: PoseData[]): Promise<{
    isCorrectForm: boolean;
    confidence: number;
    issues: string[];
  }> {
    try {
      // Analyze the sequence of keypoints to validate form
      const analysis = await analyzeMovementForm(exerciseName, keypoints);
      
      return {
        isCorrectForm: analysis.formScore >= 70,
        confidence: analysis.formScore / 100,
        issues: analysis.corrections
      };
    } catch (error) {
      console.error("Error validating exercise form:", error);
      throw new Error("Failed to validate exercise form: " + (error as Error).message);
    }
  }

  calculateMovementMetrics(keypoints: PoseData[]): {
    rangeOfMotion: number;
    stability: number;
    symmetry: number;
    tempo: number;
  } {
    if (keypoints.length === 0) {
      return { rangeOfMotion: 0, stability: 0, symmetry: 0, tempo: 0 };
    }

    // Calculate range of motion (simplified)
    let maxY = -Infinity;
    let minY = Infinity;
    
    keypoints.forEach(frame => {
      frame.keypoints.forEach(point => {
        maxY = Math.max(maxY, point.y);
        minY = Math.min(minY, point.y);
      });
    });
    
    const rangeOfMotion = (maxY - minY) * 100; // Convert to percentage

    // Calculate stability (less movement in static points = better stability)
    const hipMovement = this.calculatePointStability(keypoints, [7, 8]); // Hip indices
    const stability = Math.max(0, 100 - hipMovement * 100);

    // Calculate symmetry (compare left vs right side movements)
    const leftSideMovement = this.calculateSideMovement(keypoints, [1, 3, 5, 7, 9, 11]); // Left side indices
    const rightSideMovement = this.calculateSideMovement(keypoints, [2, 4, 6, 8, 10, 12]); // Right side indices
    const symmetry = Math.max(0, 100 - Math.abs(leftSideMovement - rightSideMovement) * 100);

    // Calculate tempo (movement speed consistency)
    const tempoVariation = this.calculateTempoVariation(keypoints);
    const tempo = Math.max(0, 100 - tempoVariation * 100);

    return {
      rangeOfMotion: Math.round(rangeOfMotion),
      stability: Math.round(stability),
      symmetry: Math.round(symmetry),
      tempo: Math.round(tempo)
    };
  }

  private calculatePointStability(keypoints: PoseData[], pointIndices: number[]): number {
    if (keypoints.length < 2) return 0;

    let totalMovement = 0;
    let count = 0;

    for (let i = 1; i < keypoints.length; i++) {
      pointIndices.forEach(index => {
        if (keypoints[i].keypoints[index] && keypoints[i-1].keypoints[index]) {
          const curr = keypoints[i].keypoints[index];
          const prev = keypoints[i-1].keypoints[index];
          const movement = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
          totalMovement += movement;
          count++;
        }
      });
    }

    return count > 0 ? totalMovement / count : 0;
  }

  private calculateSideMovement(keypoints: PoseData[], sideIndices: number[]): number {
    if (keypoints.length < 2) return 0;

    let totalMovement = 0;
    let count = 0;

    for (let i = 1; i < keypoints.length; i++) {
      sideIndices.forEach(index => {
        if (keypoints[i].keypoints[index] && keypoints[i-1].keypoints[index]) {
          const curr = keypoints[i].keypoints[index];
          const prev = keypoints[i-1].keypoints[index];
          const movement = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
          totalMovement += movement;
          count++;
        }
      });
    }

    return count > 0 ? totalMovement / count : 0;
  }

  private calculateTempoVariation(keypoints: PoseData[]): number {
    if (keypoints.length < 3) return 0;

    const movements: number[] = [];
    for (let i = 1; i < keypoints.length; i++) {
      let frameMovement = 0;
      let pointCount = 0;
      
      keypoints[i].keypoints.forEach((point, index) => {
        if (keypoints[i-1].keypoints[index]) {
          const prev = keypoints[i-1].keypoints[index];
          const movement = Math.sqrt(Math.pow(point.x - prev.x, 2) + Math.pow(point.y - prev.y, 2));
          frameMovement += movement;
          pointCount++;
        }
      });
      
      if (pointCount > 0) {
        movements.push(frameMovement / pointCount);
      }
    }

    if (movements.length < 2) return 0;

    // Calculate standard deviation of movements
    const mean = movements.reduce((sum, val) => sum + val, 0) / movements.length;
    const variance = movements.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / movements.length;
    const standardDeviation = Math.sqrt(variance);

    return mean > 0 ? standardDeviation / mean : 0;
  }
}

export const movementAnalysisService = new MovementAnalysisService();
