import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "sk-default_key"
});

export async function analyzeMovementForm(exerciseName: string, keypoints: any[]): Promise<{
  formScore: number;
  feedback: string;
  corrections: string[];
  strengths: string[];
}> {
  try {
    const prompt = `
    You are an expert personal trainer and biomechanics analyst. Analyze the movement form for the exercise "${exerciseName}" based on the following keypoint data:

    Keypoints: ${JSON.stringify(keypoints)}

    Provide a detailed analysis including:
    1. Form score (1-100)
    2. Overall feedback
    3. Specific corrections needed
    4. Movement strengths observed

    Respond with JSON in this exact format:
    {
      "formScore": number,
      "feedback": "string",
      "corrections": ["string"],
      "strengths": ["string"]
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert fitness coach and biomechanics analyst. Always provide constructive, actionable feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      formScore: Math.max(1, Math.min(100, result.formScore || 50)),
      feedback: result.feedback || "Analysis completed",
      corrections: result.corrections || [],
      strengths: result.strengths || []
    };
  } catch (error) {
    console.error("Error analyzing movement form:", error);
    throw new Error("Failed to analyze movement form: " + (error as Error).message);
  }
}

export async function generateWorkoutPlan(preferences: {
  fitnessLevel: number;
  goals: string[];
  timeAvailable: number;
  equipment: string[];
  injuries?: string[];
}): Promise<{
  name: string;
  description: string;
  difficulty: number;
  exercises: Array<{
    name: string;
    description: string;
    type: string;
    difficulty: number;
    targetMuscles: string[];
    sets?: number;
    reps?: number;
    duration?: number;
    day: number;
    order: number;
  }>;
}> {
  try {
    const prompt = `
    Generate a personalized workout plan based on these preferences:
    - Fitness Level: ${preferences.fitnessLevel}/5
    - Goals: ${preferences.goals.join(', ')}
    - Time Available: ${preferences.timeAvailable} minutes per session
    - Equipment: ${preferences.equipment.join(', ')}
    ${preferences.injuries ? `- Injuries/Limitations: ${preferences.injuries.join(', ')}` : ''}

    Create a 7-day workout plan with exercises suitable for the user's level and goals.
    Include rest days and variety in the workout types.

    Respond with JSON in this exact format:
    {
      "name": "string",
      "description": "string", 
      "difficulty": number,
      "exercises": [
        {
          "name": "string",
          "description": "string",
          "type": "strength|cardio|flexibility",
          "difficulty": number,
          "targetMuscles": ["string"],
          "sets": number,
          "reps": number,
          "duration": number,
          "day": number,
          "order": number
        }
      ]
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert personal trainer who creates safe, effective, and personalized workout plans. Always consider the user's fitness level and any limitations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      name: result.name || "Custom Workout Plan",
      description: result.description || "Personalized workout plan",
      difficulty: Math.max(1, Math.min(5, result.difficulty || preferences.fitnessLevel)),
      exercises: result.exercises || []
    };
  } catch (error) {
    console.error("Error generating workout plan:", error);
    throw new Error("Failed to generate workout plan: " + (error as Error).message);
  }
}

export async function provideNutritionAdvice(userGoals: string[], currentWeight?: number, targetWeight?: number): Promise<{
  recommendations: string[];
  mealSuggestions: string[];
  tips: string[];
}> {
  try {
    const prompt = `
    Provide nutrition advice for someone with these fitness goals: ${userGoals.join(', ')}
    ${currentWeight ? `Current weight: ${currentWeight}kg` : ''}
    ${targetWeight ? `Target weight: ${targetWeight}kg` : ''}

    Provide practical nutrition recommendations, meal suggestions, and tips.

    Respond with JSON in this exact format:
    {
      "recommendations": ["string"],
      "mealSuggestions": ["string"],
      "tips": ["string"]
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a certified nutritionist providing evidence-based nutrition advice. Always emphasize balanced, sustainable approaches."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      recommendations: result.recommendations || [],
      mealSuggestions: result.mealSuggestions || [],
      tips: result.tips || []
    };
  } catch (error) {
    console.error("Error providing nutrition advice:", error);
    throw new Error("Failed to provide nutrition advice: " + (error as Error).message);
  }
}
