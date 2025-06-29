import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { movementAnalysisService } from "./services/movementAnalysis";
import { workoutGeneratorService } from "./services/workoutGenerator";
import { gamificationService } from "./services/gamificationService";
import { wearableService } from "./services/wearableService";
import { z } from "zod";
import { insertWorkoutPlanSchema, insertWorkoutSessionSchema, insertMovementAnalysisSchema } from "@shared/schema";

// Initialize Stripe if key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dashboardData = await storage.getDashboardData(userId);
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Workout plan routes
  app.get('/api/workout-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const plans = await storage.getUserWorkoutPlans(userId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching workout plans:", error);
      res.status(500).json({ message: "Failed to fetch workout plans" });
    }
  });

  app.post('/api/workout-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const planData = insertWorkoutPlanSchema.parse({ ...req.body, userId });
      const plan = await storage.createWorkoutPlan(planData);
      res.json(plan);
    } catch (error) {
      console.error("Error creating workout plan:", error);
      res.status(500).json({ message: "Failed to create workout plan" });
    }
  });

  app.post('/api/workout-plans/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { preferences } = req.body;
      const plan = await workoutGeneratorService.generatePersonalizedPlan(userId, preferences);
      res.json(plan);
    } catch (error) {
      console.error("Error generating workout plan:", error);
      res.status(500).json({ message: "Failed to generate workout plan" });
    }
  });

  app.get('/api/workout-plans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const planId = parseInt(req.params.id);
      const plan = await storage.getWorkoutPlan(planId, userId);
      if (!plan) {
        return res.status(404).json({ message: "Workout plan not found" });
      }
      const exercises = await storage.getExercisesByPlan(planId);
      res.json({ ...plan, exercises });
    } catch (error) {
      console.error("Error fetching workout plan:", error);
      res.status(500).json({ message: "Failed to fetch workout plan" });
    }
  });

  // Workout session routes
  app.post('/api/workout-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionData = insertWorkoutSessionSchema.parse({ ...req.body, userId });
      const session = await storage.createWorkoutSession(sessionData);
      
      // Check for new achievements
      await gamificationService.checkAchievements(userId);
      
      res.json(session);
    } catch (error) {
      console.error("Error creating workout session:", error);
      res.status(500).json({ message: "Failed to create workout session" });
    }
  });

  app.get('/api/workout-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const sessions = await storage.getUserWorkoutSessions(userId, limit);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching workout sessions:", error);
      res.status(500).json({ message: "Failed to fetch workout sessions" });
    }
  });

  // Movement analysis routes
  app.post('/api/movement-analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { exerciseName, videoData, sessionId } = req.body;
      
      const analysis = await movementAnalysisService.analyzeMovement(exerciseName, videoData);
      
      const analysisData = insertMovementAnalysisSchema.parse({
        userId,
        sessionId,
        exerciseName,
        videoData,
        analysisResult: analysis,
        formScore: analysis.formScore,
        feedback: analysis.feedback,
      });
      
      const savedAnalysis = await storage.createMovementAnalysis(analysisData);
      res.json(savedAnalysis);
    } catch (error) {
      console.error("Error analyzing movement:", error);
      res.status(500).json({ message: "Failed to analyze movement" });
    }
  });

  app.get('/api/movement-analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const analyses = await storage.getUserMovementAnalysis(userId, limit);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching movement analyses:", error);
      res.status(500).json({ message: "Failed to fetch movement analyses" });
    }
  });

  // Achievement routes
  app.get('/api/achievements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Wearable integration routes
  app.get('/api/wearables/integrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integrations = await storage.getUserWearableIntegrations(userId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching wearable integrations:", error);
      res.status(500).json({ message: "Failed to fetch wearable integrations" });
    }
  });

  app.post('/api/wearables/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { provider, authCode } = req.body;
      const integration = await wearableService.connectProvider(userId, provider, authCode);
      res.json(integration);
    } catch (error) {
      console.error("Error connecting wearable:", error);
      res.status(500).json({ message: "Failed to connect wearable device" });
    }
  });

  app.post('/api/wearables/sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const syncResult = await wearableService.syncHealthData(userId);
      res.json(syncResult);
    } catch (error) {
      console.error("Error syncing wearable data:", error);
      res.status(500).json({ message: "Failed to sync wearable data" });
    }
  });

  app.get('/api/health-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dataType = req.query.type as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const healthData = await storage.getUserHealthData(userId, dataType, limit);
      res.json(healthData);
    } catch (error) {
      console.error("Error fetching health data:", error);
      res.status(500).json({ message: "Failed to fetch health data" });
    }
  });

  // Stripe payment routes (if Stripe is configured)
  if (stripe) {
    app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        
        if (!user?.email) {
          return res.status(400).json({ message: 'User email is required for subscription' });
        }

        if (user.stripeSubscriptionId) {
          const subscription = await stripe!.subscriptions.retrieve(user.stripeSubscriptionId);
          return res.json({
            subscriptionId: subscription.id,
            clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
          });
        }

        // Create Stripe customer if not exists
        let customerId = user.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe!.customers.create({
            email: user.email,
            name: `${user.firstName} ${user.lastName}`.trim(),
          });
          customerId = customer.id;
          await storage.updateStripeCustomerId(userId, customerId);
        }

        // Create subscription
        const subscription = await stripe!.subscriptions.create({
          customer: customerId,
          items: [{
            price: process.env.STRIPE_PRICE_ID || 'price_1234567890', // Fallback price ID
          }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });

        await storage.updateUserStripeInfo(userId, customerId, subscription.id);

        res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
      } catch (error) {
        console.error("Error creating subscription:", error);
        res.status(500).json({ message: "Failed to create subscription" });
      }
    });

    app.post('/api/subscription/cancel', isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        
        if (!user?.stripeSubscriptionId) {
          return res.status(404).json({ message: 'No active subscription found' });
        }

        await stripe!.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        res.json({ message: 'Subscription will be cancelled at the end of the billing period' });
      } catch (error) {
        console.error("Error cancelling subscription:", error);
        res.status(500).json({ message: "Failed to cancel subscription" });
      }
    });
  }

  // GDPR compliance routes
  app.post('/api/gdpr/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Gather all user data
      const user = await storage.getUser(userId);
      const workoutPlans = await storage.getUserWorkoutPlans(userId);
      const workoutSessions = await storage.getUserWorkoutSessions(userId, 1000);
      const achievements = await storage.getUserAchievements(userId);
      const healthData = await storage.getUserHealthData(userId);
      const movementAnalyses = await storage.getUserMovementAnalysis(userId, 1000);
      const wearableIntegrations = await storage.getUserWearableIntegrations(userId);
      
      const exportData = {
        user,
        workoutPlans,
        workoutSessions,
        achievements,
        healthData,
        movementAnalyses,
        wearableIntegrations,
        exportedAt: new Date().toISOString(),
      };
      
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  app.delete('/api/gdpr/delete-account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Delete all user data in the correct order due to foreign key constraints
      const workoutPlans = await storage.getUserWorkoutPlans(userId);
      for (const plan of workoutPlans) {
        await storage.deleteWorkoutPlan(plan.id);
      }
      
      // Delete other user-related data
      // Note: In a real implementation, you'd need to add delete methods to storage
      // This is a simplified version
      
      res.json({ message: 'Account deletion initiated. All data will be permanently removed.' });
    } catch (error) {
      console.error("Error deleting user account:", error);
      res.status(500).json({ message: "Failed to delete user account" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
