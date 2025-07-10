import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

interface BiomechanicalRule {
  esercizio: string;
  articolazione: string;
  condizione: '>' | '<' | '=' | '>=';
  limite: number;
  errore: string;
  descrizioneErrore: string;
  suggerimento: string;
  severita: 'low' | 'medium' | 'high' | 'critical';
}

interface KeypointAnalysis {
  [articolazione: string]: number;
}

interface ValidationResult {
  isValid: boolean;
  violations: Array<{
    rule: BiomechanicalRule;
    actualValue: number;
    severity: string;
    feedback: string;
  }>;
  score: number;
}

class BiomechanicalRulesEngine {
  private rules: Map<string, BiomechanicalRule[]> = new Map();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      await this.loadRulesFromExcel();
      this.initialized = true;
      console.log('BiomechanicalRulesEngine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize BiomechanicalRulesEngine:', error);
      // Fallback to demo rules if Excel not available
      this.loadDemoRules();
      this.initialized = true;
    }
  }

  private async loadRulesFromExcel() {
    const excelPath = path.join(process.cwd(), 'server/assets/regole_biomeccaniche.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.log('Excel file not found, using demo rules');
      this.loadDemoRules();
      return;
    }

    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];

    data.forEach((row: any) => {
      const rule: BiomechanicalRule = {
        esercizio: row.esercizio?.toLowerCase() || '',
        articolazione: row.articolazione || '',
        condizione: row.condizione || '>',
        limite: parseFloat(row.limite) || 0,
        errore: row.errore || '',
        descrizioneErrore: row.descrizione_errore || '',
        suggerimento: row.suggerimento || '',
        severita: row.severita || 'medium'
      };

      if (!this.rules.has(rule.esercizio)) {
        this.rules.set(rule.esercizio, []);
      }
      this.rules.get(rule.esercizio)!.push(rule);
    });
  }

  private loadDemoRules() {
    // Demo rules for common exercises
    const demoRules: BiomechanicalRule[] = [
      // SQUAT Rules
      {
        esercizio: 'squat',
        articolazione: 'knee_angle',
        condizione: '>',
        limite: 120,
        errore: 'knee_valgus',
        descrizioneErrore: 'Ginocchia che si avvicinano verso l\'interno',
        suggerimento: 'Mantieni le ginocchia allineate con le punte dei piedi',
        severita: 'high'
      },
      {
        esercizio: 'squat',
        articolazione: 'hip_angle',
        condizione: '<',
        limite: 90,
        errore: 'insufficient_depth',
        descrizioneErrore: 'Profondità squat insufficiente',
        suggerimento: 'Scendi fino a portare i fianchi sotto il livello delle ginocchia',
        severita: 'medium'
      },
      {
        esercizio: 'squat',
        articolazione: 'back_angle',
        condizione: '>',
        limite: 45,
        errore: 'forward_lean',
        descrizioneErrore: 'Troppo sbilanciamento in avanti',
        suggerimento: 'Mantieni il petto alto e la schiena dritta',
        severita: 'high'
      },

      // PUSH-UP Rules
      {
        esercizio: 'pushup',
        articolazione: 'elbow_angle',
        condizione: '>',
        limite: 45,
        errore: 'wide_elbows',
        descrizioneErrore: 'Gomiti troppo larghi',
        suggerimento: 'Mantieni i gomiti vicini al corpo (circa 45 gradi)',
        severita: 'medium'
      },
      {
        esercizio: 'pushup',
        articolazione: 'body_line',
        condizione: '>',
        limite: 10,
        errore: 'sagging_hips',
        descrizioneErrore: 'Fianchi che cadono verso il basso',
        suggerimento: 'Mantieni una linea retta dalla testa ai talloni',
        severita: 'high'
      },

      // LUNGE Rules
      {
        esercizio: 'lunge',
        articolazione: 'front_knee_angle',
        condizione: '<',
        limite: 90,
        errore: 'shallow_lunge',
        descrizioneErrore: 'Affondo troppo superficiale',
        suggerimento: 'Scendi fino a formare un angolo di 90 gradi con il ginocchio anteriore',
        severita: 'medium'
      },
      {
        esercizio: 'lunge',
        articolazione: 'knee_forward',
        condizione: '>',
        limite: 5,
        errore: 'knee_over_toe',
        descrizioneErrore: 'Ginocchio che supera la punta del piede',
        suggerimento: 'Mantieni il ginocchio allineato sopra la caviglia',
        severita: 'high'
      }
    ];

    demoRules.forEach(rule => {
      if (!this.rules.has(rule.esercizio)) {
        this.rules.set(rule.esercizio, []);
      }
      this.rules.get(rule.esercizio)!.push(rule);
    });
  }

  async validateExercise(exerciseName: string, keypoints: KeypointAnalysis): Promise<ValidationResult> {
    await this.initialize();

    const exerciseRules = this.rules.get(exerciseName.toLowerCase()) || [];
    const violations: ValidationResult['violations'] = [];

    for (const rule of exerciseRules) {
      const actualValue = keypoints[rule.articolazione];
      
      if (actualValue === undefined) continue;

      let isViolation = false;
      switch (rule.condizione) {
        case '>':
          isViolation = actualValue > rule.limite;
          break;
        case '<':
          isViolation = actualValue < rule.limite;
          break;
        case '>=':
          isViolation = actualValue >= rule.limite;
          break;
        case '=':
          isViolation = Math.abs(actualValue - rule.limite) > 5; // 5 degree tolerance
          break;
      }

      if (isViolation) {
        violations.push({
          rule,
          actualValue,
          severity: rule.severita,
          feedback: rule.suggerimento
        });
      }
    }

    // Calculate score based on violations and their severity
    const score = this.calculateScore(violations, exerciseRules.length);

    return {
      isValid: violations.length === 0,
      violations,
      score
    };
  }

  private calculateScore(violations: ValidationResult['violations'], totalRules: number): number {
    if (totalRules === 0) return 100;
    if (violations.length === 0) return 100;

    let severityPenalty = 0;
    violations.forEach(violation => {
      switch (violation.severity) {
        case 'critical':
          severityPenalty += 30;
          break;
        case 'high':
          severityPenalty += 20;
          break;
        case 'medium':
          severityPenalty += 10;
          break;
        case 'low':
          severityPenalty += 5;
          break;
      }
    });

    const score = Math.max(0, 100 - severityPenalty);
    return Math.round(score);
  }

  getRulesForExercise(exerciseName: string): BiomechanicalRule[] {
    return this.rules.get(exerciseName.toLowerCase()) || [];
  }

  getAllExercises(): string[] {
    return Array.from(this.rules.keys());
  }

  // Convert MediaPipe keypoints to biomechanical angles
  extractBiomechanicalAngles(keypoints: any[]): KeypointAnalysis {
    if (!keypoints || keypoints.length === 0) {
      return {};
    }

    // Take the middle frame for analysis (most stable)
    const middleFrame = keypoints[Math.floor(keypoints.length / 2)];
    const points = middleFrame.keypoints;

    const analysis: KeypointAnalysis = {};

    try {
      // Calculate knee angle (hip-knee-ankle)
      if (points[7] && points[9] && points[11]) { // Left side
        const hipKneeAngle = this.calculateAngle(points[7], points[9], points[11]);
        analysis.knee_angle = hipKneeAngle;
      }

      // Calculate hip angle (approximate)
      if (points[7] && points[8] && points[9] && points[10]) {
        const hipFlexion = this.calculateHipFlexion(points[7], points[8], points[9], points[10]);
        analysis.hip_angle = hipFlexion;
      }

      // Calculate elbow angle for push-ups
      if (points[1] && points[3] && points[5]) { // Left arm
        const elbowAngle = this.calculateAngle(points[1], points[3], points[5]);
        analysis.elbow_angle = elbowAngle;
      }

      // Calculate body line deviation
      if (points[0] && points[7] && points[11]) { // Head-hip-ankle
        const bodyLineDeviation = this.calculateBodyLineDeviation(points[0], points[7], points[11]);
        analysis.body_line = bodyLineDeviation;
      }

      // Calculate forward knee position for lunges
      if (points[9] && points[11]) {
        const kneeForward = Math.abs(points[9].x - points[11].x) * 100;
        analysis.knee_forward = kneeForward;
      }

      // Additional angles can be added here based on exercise needs

    } catch (error) {
      console.error('Error extracting biomechanical angles:', error);
    }

    return analysis;
  }

  private calculateAngle(point1: any, point2: any, point3: any): number {
    const vector1 = {
      x: point1.x - point2.x,
      y: point1.y - point2.y
    };
    const vector2 = {
      x: point3.x - point2.x,
      y: point3.y - point2.y
    };

    const dot = vector1.x * vector2.x + vector1.y * vector2.y;
    const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

    const cosAngle = dot / (mag1 * mag2);
    const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    
    return (angle * 180) / Math.PI;
  }

  private calculateHipFlexion(leftHip: any, rightHip: any, leftKnee: any, rightKnee: any): number {
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };
    const kneeCenter = {
      x: (leftKnee.x + rightKnee.x) / 2,
      y: (leftKnee.y + rightKnee.y) / 2
    };

    // Calculate angle from vertical
    const deltaY = kneeCenter.y - hipCenter.y;
    const deltaX = kneeCenter.x - hipCenter.x;
    const angle = Math.atan2(deltaX, deltaY) * 180 / Math.PI;
    
    return Math.abs(angle);
  }

  private calculateBodyLineDeviation(head: any, hip: any, ankle: any): number {
    // Calculate how much the body deviates from a straight line
    const expectedHipY = head.y + (ankle.y - head.y) * 0.7; // Hip should be about 70% down
    const deviation = Math.abs(hip.y - expectedHipY) * 100;
    
    return deviation;
  }
}

export const biomechanicalRulesEngine = new BiomechanicalRulesEngine();
export type { BiomechanicalRule, KeypointAnalysis, ValidationResult };
