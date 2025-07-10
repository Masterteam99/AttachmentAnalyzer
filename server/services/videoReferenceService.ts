import * as fs from 'fs';
import * as path from 'path';

interface PTVideoReference {
  exerciseName: string;
  videoUrl: string;
  keypoints: any[];
  duration: number;
  instructions: string[];
  tips: string[];
}

interface PTKeypointsData {
  exerciseName: string;
  keypoints: any[];
  metadata: {
    frameRate: number;
    totalFrames: number;
    duration: number;
    captureDate: string;
  };
}

class VideoReferenceService {
  private videoReferences: Map<string, PTVideoReference> = new Map();
  private keypointsCache: Map<string, PTKeypointsData> = new Map();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      await this.loadVideoReferences();
      await this.loadPTKeypoints();
      this.initialized = true;
      console.log('VideoReferenceService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize VideoReferenceService:', error);
      this.loadDemoReferences();
      this.initialized = true;
    }
  }

  private async loadVideoReferences() {
    const videosPath = path.join(process.cwd(), 'server/assets/video_pt');
    
    if (!fs.existsSync(videosPath)) {
      console.log('PT videos directory not found, creating with demo data');
      fs.mkdirSync(videosPath, { recursive: true });
      this.loadDemoReferences();
      return;
    }

    // Scan for video files and load metadata
    const videoFiles = fs.readdirSync(videosPath).filter(file => 
      file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mov')
    );

    videoFiles.forEach(videoFile => {
      const exerciseName = path.basename(videoFile, path.extname(videoFile));
      const metadataFile = path.join(videosPath, `${exerciseName}_metadata.json`);
      
      let metadata: any = {};
      if (fs.existsSync(metadataFile)) {
        metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
      }

      const reference: PTVideoReference = {
        exerciseName: exerciseName.toLowerCase(),
        videoUrl: `/assets/video_pt/${videoFile}`,
        keypoints: metadata.keypoints || [],
        duration: metadata.duration || 10,
        instructions: metadata.instructions || [],
        tips: metadata.tips || []
      };

      this.videoReferences.set(exerciseName.toLowerCase(), reference);
    });
  }

  private async loadPTKeypoints() {
    const keypointsPath = path.join(process.cwd(), 'server/assets/keypoints_pt');
    
    if (!fs.existsSync(keypointsPath)) {
      console.log('PT keypoints directory not found, creating...');
      fs.mkdirSync(keypointsPath, { recursive: true });
      return;
    }

    const keypointFiles = fs.readdirSync(keypointsPath).filter(file => 
      file.endsWith('_keypoints.json')
    );

    keypointFiles.forEach(file => {
      try {
        const filePath = path.join(keypointsPath, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const exerciseName = file.replace('_keypoints.json', '').toLowerCase();
        
        this.keypointsCache.set(exerciseName, data);
      } catch (error) {
        console.error(`Error loading keypoints file ${file}:`, error);
      }
    });
  }

  private loadDemoReferences() {
    // Demo video references with simulated data
    const demoExercises = ['squat', 'pushup', 'lunge', 'plank', 'burpee'];
    
    demoExercises.forEach(exercise => {
      const reference: PTVideoReference = {
        exerciseName: exercise,
        videoUrl: `/assets/video_pt/demo_${exercise}.mp4`,
        keypoints: this.generateDemoKeypoints(exercise),
        duration: 10,
        instructions: this.getExerciseInstructions(exercise),
        tips: this.getExerciseTips(exercise)
      };

      this.videoReferences.set(exercise, reference);

      // Also create demo keypoints data
      const keypointsData: PTKeypointsData = {
        exerciseName: exercise,
        keypoints: this.generateDemoKeypoints(exercise),
        metadata: {
          frameRate: 30,
          totalFrames: 300,
          duration: 10,
          captureDate: new Date().toISOString()
        }
      };

      this.keypointsCache.set(exercise, keypointsData);
    });
  }

  private generateDemoKeypoints(exercise: string): any[] {
    // Generate realistic keypoints for demo purposes
    const frames: any[] = [];
    const frameCount = 300; // 10 seconds at 30fps

    for (let i = 0; i < frameCount; i++) {
      const progress = i / frameCount;
      const keypoints = this.generateExerciseKeypoints(exercise, progress);
      
      frames.push({
        keypoints,
        timestamp: i * 33.33, // 30 FPS
        frameNumber: i
      });
    }

    return frames;
  }

  private generateExerciseKeypoints(exercise: string, progress: number): any[] {
    const baseKeypoints = [
      { x: 0.5, y: 0.2, visibility: 0.9 }, // Head
      { x: 0.45, y: 0.35, visibility: 0.8 }, // Left shoulder
      { x: 0.55, y: 0.35, visibility: 0.8 }, // Right shoulder
      { x: 0.4, y: 0.5, visibility: 0.7 }, // Left elbow
      { x: 0.6, y: 0.5, visibility: 0.7 }, // Right elbow
      { x: 0.35, y: 0.65, visibility: 0.6 }, // Left wrist
      { x: 0.65, y: 0.65, visibility: 0.6 }, // Right wrist
      { x: 0.48, y: 0.7, visibility: 0.9 }, // Left hip
      { x: 0.52, y: 0.7, visibility: 0.9 }, // Right hip
      { x: 0.47, y: 0.85, visibility: 0.8 }, // Left knee
      { x: 0.53, y: 0.85, visibility: 0.8 }, // Right knee
      { x: 0.46, y: 0.95, visibility: 0.7 }, // Left ankle
      { x: 0.54, y: 0.95, visibility: 0.7 }, // Right ankle
    ];

    // Modify keypoints based on exercise type and progress
    switch (exercise) {
      case 'squat':
        return this.modifyForSquat(baseKeypoints, progress);
      case 'pushup':
        return this.modifyForPushup(baseKeypoints, progress);
      case 'lunge':
        return this.modifyForLunge(baseKeypoints, progress);
      default:
        return baseKeypoints;
    }
  }

  private modifyForSquat(keypoints: any[], progress: number): any[] {
    // Simulate squat movement - up and down motion
    const squatDepth = Math.sin(progress * Math.PI * 2) * 0.1; // 2 full squats
    
    // Modify hip and knee positions for squat
    keypoints[7].y += squatDepth; // Left hip
    keypoints[8].y += squatDepth; // Right hip
    keypoints[9].y += squatDepth * 1.2; // Left knee
    keypoints[10].y += squatDepth * 1.2; // Right knee
    
    return keypoints;
  }

  private modifyForPushup(keypoints: any[], progress: number): any[] {
    // Simulate push-up movement - arms extending and flexing
    const pushupMotion = Math.sin(progress * Math.PI * 4) * 0.05; // 4 push-ups
    
    // Modify arm positions
    keypoints[3].y += pushupMotion; // Left elbow
    keypoints[4].y += pushupMotion; // Right elbow
    keypoints[5].y += pushupMotion * 1.5; // Left wrist
    keypoints[6].y += pushupMotion * 1.5; // Right wrist
    
    return keypoints;
  }

  private modifyForLunge(keypoints: any[], progress: number): any[] {
    // Simulate lunge movement - forward and back
    const lungeMotion = Math.sin(progress * Math.PI * 2) * 0.1;
    
    // Modify leg positions for lunge
    keypoints[9].x += lungeMotion; // Left knee forward
    keypoints[11].x += lungeMotion; // Left ankle forward
    keypoints[9].y += Math.abs(lungeMotion) * 0.5; // Knee down
    
    return keypoints;
  }

  private getExerciseInstructions(exercise: string): string[] {
    const instructions: { [key: string]: string[] } = {
      squat: [
        "Piedi larghezza spalle, punte leggermente verso l'esterno",
        "Scendi portando i fianchi indietro e giù",
        "Mantieni il peso sui talloni",
        "Scendi fino a portare i fianchi sotto le ginocchia",
        "Risali spingendo attraverso i talloni"
      ],
      pushup: [
        "Posizione plank con mani sotto le spalle",
        "Corpo in linea retta dalla testa ai talloni",
        "Scendi controllando il movimento",
        "Tocca il petto a terra mantenendo la forma",
        "Spingi verso l'alto mantenendo la linea del corpo"
      ],
      lunge: [
        "Piedi larghezza fianchi, passo avanti",
        "Scendi dritto verso il basso",
        "Ginocchio anteriore a 90 gradi",
        "Ginocchio posteriore vicino a terra",
        "Risali spingendo con il tallone anteriore"
      ],
      plank: [
        "Avambracci a terra, gomiti sotto le spalle",
        "Corpo in linea retta",
        "Contrai addominali e glutei",
        "Mantieni la posizione respirando normalmente"
      ],
      burpee: [
        "Squat, mani a terra",
        "Salta indietro in posizione plank",
        "Push-up opzionale",
        "Salta i piedi verso le mani",
        "Salto esplosivo verso l'alto"
      ]
    };

    return instructions[exercise] || ["Segui le istruzioni del trainer"];
  }

  private getExerciseTips(exercise: string): string[] {
    const tips: { [key: string]: string[] } = {
      squat: [
        "Mantieni il petto alto durante tutto il movimento",
        "Non lasciare che le ginocchia cadano verso l'interno",
        "Respira in discesa, espira in salita"
      ],
      pushup: [
        "Contrai gli addominali per mantenere la linea del corpo",
        "Non lasciare cadere i fianchi",
        "Controlla sia la discesa che la salita"
      ],
      lunge: [
        "Il ginocchio anteriore non deve superare la punta del piede",
        "Mantieni il busto eretto",
        "Distribuisci il peso su entrambe le gambe"
      ],
      plank: [
        "Non alzare troppo i fianchi",
        "Mantieni la testa in posizione neutra",
        "Respira regolarmente"
      ],
      burpee: [
        "Mantieni il ritmo costante",
        "Atterraggi morbidi sui piedi",
        "Usa le braccia per slancio nel salto"
      ]
    };

    return tips[exercise] || ["Mantieni sempre la forma corretta"];
  }

  async getVideoReference(exerciseName: string): Promise<PTVideoReference | null> {
    await this.initialize();
    return this.videoReferences.get(exerciseName.toLowerCase()) || null;
  }

  async getPTKeypoints(exerciseName: string): Promise<PTKeypointsData | null> {
    await this.initialize();
    return this.keypointsCache.get(exerciseName.toLowerCase()) || null;
  }

  async getAllExerciseVideos(): Promise<PTVideoReference[]> {
    await this.initialize();
    return Array.from(this.videoReferences.values());
  }

  // Save PT keypoints for future reference
  async savePTKeypoints(exerciseName: string, keypoints: any[], metadata: any): Promise<void> {
    const keypointsData: PTKeypointsData = {
      exerciseName: exerciseName.toLowerCase(),
      keypoints,
      metadata: {
        frameRate: metadata.frameRate || 30,
        totalFrames: keypoints.length,
        duration: metadata.duration || (keypoints.length / (metadata.frameRate || 30)),
        captureDate: new Date().toISOString()
      }
    };

    this.keypointsCache.set(exerciseName.toLowerCase(), keypointsData);

    // Save to file system
    const keypointsPath = path.join(process.cwd(), 'server/assets/keypoints_pt');
    if (!fs.existsSync(keypointsPath)) {
      fs.mkdirSync(keypointsPath, { recursive: true });
    }

    const filePath = path.join(keypointsPath, `${exerciseName.toLowerCase()}_keypoints.json`);
    fs.writeFileSync(filePath, JSON.stringify(keypointsData, null, 2));
  }

  // Compare user keypoints with PT reference
  async compareWithPTReference(exerciseName: string, userKeypoints: any[]): Promise<{
    similarityScore: number;
    differences: Array<{
      bodyPart: string;
      difference: number;
      severity: 'low' | 'medium' | 'high';
      suggestion: string;
    }>;
    overallFeedback: string;
  }> {
    await this.initialize();
    
    const ptData = await this.getPTKeypoints(exerciseName);
    if (!ptData) {
      throw new Error(`No PT reference found for exercise: ${exerciseName}`);
    }

    const ptKeypoints = ptData.keypoints;
    
    // Ensure both sequences have similar length
    const minLength = Math.min(userKeypoints.length, ptKeypoints.length);
    const differences: any[] = [];
    let totalSimilarity = 0;

    // Compare keypoints frame by frame
    for (let frameIndex = 0; frameIndex < minLength; frameIndex += Math.floor(minLength / 10)) {
      const userFrame = userKeypoints[frameIndex];
      const ptFrame = ptKeypoints[frameIndex];

      if (!userFrame || !ptFrame) continue;

      const frameSimilarity = this.compareFrameKeypoints(userFrame.keypoints, ptFrame.keypoints);
      totalSimilarity += frameSimilarity.score;

      frameSimilarity.differences.forEach(diff => differences.push(diff));
    }

    const averageSimilarity = totalSimilarity / Math.ceil(minLength / Math.floor(minLength / 10));
    const uniqueDifferences = this.aggregateDifferences(differences);

    return {
      similarityScore: Math.round(averageSimilarity),
      differences: uniqueDifferences,
      overallFeedback: this.generateComparisonFeedback(averageSimilarity, uniqueDifferences)
    };
  }

  private compareFrameKeypoints(userPoints: any[], ptPoints: any[]): {
    score: number;
    differences: Array<{
      bodyPart: string;
      difference: number;
      severity: 'low' | 'medium' | 'high';
      suggestion: string;
    }>;
  } {
    const bodyParts = [
      'head', 'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
      'left_wrist', 'right_wrist', 'left_hip', 'right_hip', 'left_knee',
      'right_knee', 'left_ankle', 'right_ankle'
    ];

    let totalDifference = 0;
    const differences: any[] = [];

    for (let i = 0; i < Math.min(userPoints.length, ptPoints.length); i++) {
      const userPoint = userPoints[i];
      const ptPoint = ptPoints[i];

      if (!userPoint || !ptPoint) continue;

      const distance = Math.sqrt(
        Math.pow(userPoint.x - ptPoint.x, 2) + Math.pow(userPoint.y - ptPoint.y, 2)
      );

      totalDifference += distance;

      if (distance > 0.05) { // Threshold for significant difference
        const severity = distance > 0.15 ? 'high' : distance > 0.1 ? 'medium' : 'low';
        differences.push({
          bodyPart: bodyParts[i] || `point_${i}`,
          difference: distance,
          severity,
          suggestion: this.getSuggestionForBodyPart(bodyParts[i] || `point_${i}`, severity)
        });
      }
    }

    const averageDifference = totalDifference / Math.min(userPoints.length, ptPoints.length);
    const similarity = Math.max(0, 100 - (averageDifference * 200)); // Scale to 0-100

    return { score: similarity, differences };
  }

  private aggregateDifferences(differences: any[]): any[] {
    const aggregated = new Map();

    differences.forEach(diff => {
      const existing = aggregated.get(diff.bodyPart);
      if (!existing || diff.difference > existing.difference) {
        aggregated.set(diff.bodyPart, diff);
      }
    });

    return Array.from(aggregated.values())
      .sort((a, b) => b.difference - a.difference)
      .slice(0, 3); // Top 3 differences
  }

  private getSuggestionForBodyPart(bodyPart: string, severity: string): string {
    const suggestions: { [key: string]: { [key: string]: string } } = {
      head: {
        low: "Mantieni lo sguardo dritto avanti",
        medium: "Evita di guardare in basso o in alto",
        high: "Posizione della testa significativamente diversa dal riferimento"
      },
      left_shoulder: {
        low: "Leggero aggiustamento della spalla sinistra",
        medium: "Mantieni le spalle allineate",
        high: "Posizione spalla sinistra molto diversa dal riferimento"
      },
      right_shoulder: {
        low: "Leggero aggiustamento della spalla destra",
        medium: "Mantieni le spalle allineate",
        high: "Posizione spalla destra molto diversa dal riferimento"
      },
      left_hip: {
        low: "Piccolo aggiustamento del fianco sinistro",
        medium: "Mantieni i fianchi allineati",
        high: "Posizione fianco sinistro molto diversa"
      },
      right_hip: {
        low: "Piccolo aggiustamento del fianco destro",
        medium: "Mantieni i fianchi allineati",
        high: "Posizione fianco destro molto diversa"
      }
    };

    return suggestions[bodyPart]?.[severity] || `Aggiusta la posizione di ${bodyPart}`;
  }

  private generateComparisonFeedback(similarity: number, differences: any[]): string {
    if (similarity >= 90) {
      return "Eccellente! La tua esecuzione è molto simile a quella del trainer.";
    } else if (similarity >= 75) {
      return "Buona esecuzione! Piccoli aggiustamenti potrebbero migliorare la forma.";
    } else if (similarity >= 60) {
      return "Discreta esecuzione, ma ci sono alcuni aspetti da migliorare.";
    } else {
      return "L'esecuzione necessita di miglioramenti significativi. Concentrati sui punti evidenziati.";
    }
  }
}

export const videoReferenceService = new VideoReferenceService();
export type { PTVideoReference, PTKeypointsData };
