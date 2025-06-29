import { Router } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { createInsertSchema } from "drizzle-zod";
import { exerciseTemplates, biomechanicalRules, correctiveFeedback } from "@shared/schema";

const router = Router();

// Create insert schemas for validation
const insertExerciseTemplateSchema = createInsertSchema(exerciseTemplates);
const insertBiomechanicalRuleSchema = createInsertSchema(biomechanicalRules);
const insertCorrectiveFeedbackSchema = createInsertSchema(correctiveFeedback);

// Exercise Templates Management
router.get("/exercise-templates", isAuthenticated, async (req, res) => {
  try {
    const templates = await storage.getAllExerciseTemplates();
    res.json(templates);
  } catch (error) {
    console.error("Error fetching exercise templates:", error);
    res.status(500).json({ message: "Failed to fetch exercise templates" });
  }
});

router.post("/exercise-templates", isAuthenticated, async (req, res) => {
  try {
    const validatedData = insertExerciseTemplateSchema.parse(req.body);
    const template = await storage.createExerciseTemplate(validatedData);
    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating exercise template:", error);
    res.status(500).json({ message: "Failed to create exercise template" });
  }
});

// Bulk content seeding endpoint
router.post("/seed-exercise-content", isAuthenticated, async (req, res) => {
  try {
    const { exerciseData } = req.body;
    
    if (!exerciseData || !Array.isArray(exerciseData)) {
      return res.status(400).json({ message: "Invalid exercise data format" });
    }

    const results = [];
    
    for (const exercise of exerciseData) {
      // Create exercise template
      const template = await storage.createExerciseTemplate({
        name: exercise.name,
        category: exercise.category,
        description: exercise.description,
        referenceVideoUrl: exercise.referenceVideoUrl,
        referenceVideoKeypoints: exercise.referenceVideoKeypoints,
        difficulty: exercise.difficulty,
        targetMuscles: exercise.targetMuscles,
        equipment: exercise.equipment,
        instructions: exercise.instructions,
        commonMistakes: exercise.commonMistakes
      });

      // Create biomechanical rules
      if (exercise.biomechanicalRules) {
        for (const rule of exercise.biomechanicalRules) {
          await storage.createBiomechanicalRule({
            exerciseTemplateId: template.id,
            ...rule
          });
        }
      }

      // Create corrective feedback
      if (exercise.correctiveFeedback) {
        for (const feedback of exercise.correctiveFeedback) {
          await storage.createCorrectiveFeedback({
            exerciseTemplateId: template.id,
            ...feedback
          });
        }
      }

      results.push(template);
    }

    res.json({ 
      message: `Successfully seeded ${results.length} exercises with content`,
      exercises: results 
    });
  } catch (error) {
    console.error("Error seeding exercise content:", error);
    res.status(500).json({ message: "Failed to seed exercise content" });
  }
});

export default router;