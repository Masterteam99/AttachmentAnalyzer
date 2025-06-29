import {
  users,
  workoutPlans,
  exercises,
  workoutSessions,
  achievements,
  userStats,
  wearableIntegrations,
  healthData,
  movementAnalysis,
  exerciseTemplates,
  biomechanicalRules,
  correctiveFeedback,
  type User,
  type UpsertUser,
  type WorkoutPlan,
  type InsertWorkoutPlan,
  type Exercise,
  type InsertExercise,
  type WorkoutSession,
  type InsertWorkoutSession,
  type Achievement,
  type InsertAchievement,
  type UserStats,
  type WearableIntegration,
  type HealthData,
  type MovementAnalysis,
  type InsertMovementAnalysis,
  type ExerciseTemplate,
  type InsertExerciseTemplate,
  type BiomechanicalRule,
  type InsertBiomechanicalRule,
  type CorrectiveFeedback,
  type InsertCorrectiveFeedback,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Dashboard operations
  getUserStats(userId: string): Promise<UserStats | undefined>;
  updateUserStats(userId: string, stats: Partial<UserStats>): Promise<UserStats>;
  getDashboardData(userId: string): Promise<any>;
  
  // Workout operations
  createWorkoutPlan(plan: InsertWorkoutPlan): Promise<WorkoutPlan>;
  getUserWorkoutPlans(userId: string): Promise<WorkoutPlan[]>;
  getWorkoutPlan(id: number, userId: string): Promise<WorkoutPlan | undefined>;
  updateWorkoutPlan(id: number, plan: Partial<InsertWorkoutPlan>): Promise<WorkoutPlan>;
  deleteWorkoutPlan(id: number): Promise<void>;
  
  // Exercise operations
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  getExercisesByPlan(planId: number): Promise<Exercise[]>;
  updateExercise(id: number, exercise: Partial<InsertExercise>): Promise<Exercise>;
  deleteExercise(id: number): Promise<void>;
  
  // Workout session operations
  createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession>;
  getUserWorkoutSessions(userId: string, limit?: number): Promise<WorkoutSession[]>;
  getWorkoutSession(id: number): Promise<WorkoutSession | undefined>;
  
  // Achievement operations
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getUserAchievements(userId: string): Promise<Achievement[]>;
  
  // Wearable operations
  createWearableIntegration(integration: any): Promise<WearableIntegration>;
  getUserWearableIntegrations(userId: string): Promise<WearableIntegration[]>;
  updateWearableIntegration(id: number, integration: any): Promise<WearableIntegration>;
  deleteWearableIntegration(id: number): Promise<void>;
  
  // Health data operations
  createHealthData(data: any): Promise<HealthData>;
  getUserHealthData(userId: string, dataType?: string, limit?: number): Promise<HealthData[]>;
  
  // Movement analysis operations
  createMovementAnalysis(analysis: InsertMovementAnalysis): Promise<MovementAnalysis>;
  getUserMovementAnalysis(userId: string, limit?: number): Promise<MovementAnalysis[]>;
  
  // Subscription operations
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User>;
  updateStripeCustomerId(userId: string, customerId: string): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    // Initialize user stats if new user
    const existingStats = await db.select().from(userStats).where(eq(userStats.userId, user.id));
    if (existingStats.length === 0) {
      await db.insert(userStats).values({
        userId: user.id,
        currentStreak: 0,
        longestStreak: 0,
        totalWorkouts: 0,
        totalCaloriesBurned: 0,
        weeklyGoal: 4,
        weeklyProgress: 0,
      });
    }
    
    return user;
  }

  // Dashboard operations
  async getUserStats(userId: string): Promise<UserStats | undefined> {
    const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return stats;
  }

  async updateUserStats(userId: string, statsUpdate: Partial<UserStats>): Promise<UserStats> {
    const [stats] = await db
      .update(userStats)
      .set({ ...statsUpdate, updatedAt: new Date() })
      .where(eq(userStats.userId, userId))
      .returning();
    return stats;
  }

  async getDashboardData(userId: string): Promise<any> {
    // Get user stats
    const stats = await this.getUserStats(userId);
    
    // Get recent workout sessions
    const recentSessions = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .orderBy(desc(workoutSessions.completedAt))
      .limit(5);
    
    // Get recent achievements
    const recentAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.earnedAt))
      .limit(3);
    
    // Get recent health data
    const recentHealthData = await db
      .select()
      .from(healthData)
      .where(eq(healthData.userId, userId))
      .orderBy(desc(healthData.recordedAt))
      .limit(10);
    
    return {
      stats,
      recentSessions,
      recentAchievements,
      recentHealthData,
    };
  }

  // Workout operations
  async createWorkoutPlan(plan: InsertWorkoutPlan): Promise<WorkoutPlan> {
    const [newPlan] = await db.insert(workoutPlans).values(plan).returning();
    return newPlan;
  }

  async getUserWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
    return await db
      .select()
      .from(workoutPlans)
      .where(eq(workoutPlans.userId, userId))
      .orderBy(desc(workoutPlans.createdAt));
  }

  async getWorkoutPlan(id: number, userId: string): Promise<WorkoutPlan | undefined> {
    const [plan] = await db
      .select()
      .from(workoutPlans)
      .where(and(eq(workoutPlans.id, id), eq(workoutPlans.userId, userId)));
    return plan;
  }

  async updateWorkoutPlan(id: number, planUpdate: Partial<InsertWorkoutPlan>): Promise<WorkoutPlan> {
    const [plan] = await db
      .update(workoutPlans)
      .set(planUpdate)
      .where(eq(workoutPlans.id, id))
      .returning();
    return plan;
  }

  async deleteWorkoutPlan(id: number): Promise<void> {
    await db.delete(exercises).where(eq(exercises.planId, id));
    await db.delete(workoutPlans).where(eq(workoutPlans.id, id));
  }

  // Exercise operations
  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const [newExercise] = await db.insert(exercises).values(exercise).returning();
    return newExercise;
  }

  async getExercisesByPlan(planId: number): Promise<Exercise[]> {
    return await db
      .select()
      .from(exercises)
      .where(eq(exercises.planId, planId))
      .orderBy(exercises.day, exercises.order);
  }

  async updateExercise(id: number, exerciseUpdate: Partial<InsertExercise>): Promise<Exercise> {
    const [exercise] = await db
      .update(exercises)
      .set(exerciseUpdate)
      .where(eq(exercises.id, id))
      .returning();
    return exercise;
  }

  async deleteExercise(id: number): Promise<void> {
    await db.delete(exercises).where(eq(exercises.id, id));
  }

  // Workout session operations
  async createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession> {
    const [newSession] = await db.insert(workoutSessions).values(session).returning();
    
    // Update user stats
    const stats = await this.getUserStats(session.userId);
    if (stats) {
      const newTotalWorkouts = (stats.totalWorkouts || 0) + 1;
      const newTotalCalories = (stats.totalCaloriesBurned || 0) + (session.caloriesBurned || 0);
      
      // Calculate streak
      const lastWorkout = stats.lastWorkoutDate;
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let newStreak = stats.currentStreak || 0;
      if (!lastWorkout || lastWorkout.toDateString() === yesterday.toDateString()) {
        newStreak += 1;
      } else if (lastWorkout.toDateString() !== today.toDateString()) {
        newStreak = 1;
      }
      
      await this.updateUserStats(session.userId, {
        totalWorkouts: newTotalWorkouts,
        totalCaloriesBurned: newTotalCalories,
        currentStreak: newStreak,
        longestStreak: Math.max(stats.longestStreak || 0, newStreak),
        lastWorkoutDate: new Date(),
      });
    }
    
    return newSession;
  }

  async getUserWorkoutSessions(userId: string, limit = 10): Promise<WorkoutSession[]> {
    return await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .orderBy(desc(workoutSessions.completedAt))
      .limit(limit);
  }

  async getWorkoutSession(id: number): Promise<WorkoutSession | undefined> {
    const [session] = await db.select().from(workoutSessions).where(eq(workoutSessions.id, id));
    return session;
  }

  // Achievement operations
  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db.insert(achievements).values(achievement).returning();
    return newAchievement;
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.earnedAt));
  }

  // Wearable operations
  async createWearableIntegration(integration: any): Promise<WearableIntegration> {
    const [newIntegration] = await db.insert(wearableIntegrations).values(integration).returning();
    return newIntegration;
  }

  async getUserWearableIntegrations(userId: string): Promise<WearableIntegration[]> {
    return await db
      .select()
      .from(wearableIntegrations)
      .where(eq(wearableIntegrations.userId, userId));
  }

  async updateWearableIntegration(id: number, integration: any): Promise<WearableIntegration> {
    const [updated] = await db
      .update(wearableIntegrations)
      .set(integration)
      .where(eq(wearableIntegrations.id, id))
      .returning();
    return updated;
  }

  async deleteWearableIntegration(id: number): Promise<void> {
    await db.delete(wearableIntegrations).where(eq(wearableIntegrations.id, id));
  }

  // Health data operations
  async createHealthData(data: any): Promise<HealthData> {
    const [newData] = await db.insert(healthData).values(data).returning();
    return newData;
  }

  async getUserHealthData(userId: string, dataType?: string, limit = 50): Promise<HealthData[]> {
    let query = db
      .select()
      .from(healthData)
      .where(eq(healthData.userId, userId));
    
    if (dataType) {
      query = db
        .select()
        .from(healthData)
        .where(and(eq(healthData.userId, userId), eq(healthData.dataType, dataType)));
    }
    
    return await query
      .orderBy(desc(healthData.recordedAt))
      .limit(limit);
  }

  // Movement analysis operations
  async createMovementAnalysis(analysis: InsertMovementAnalysis): Promise<MovementAnalysis> {
    const [newAnalysis] = await db.insert(movementAnalysis).values(analysis).returning();
    return newAnalysis;
  }

  // Exercise template operations
  async getAllExerciseTemplates(): Promise<ExerciseTemplate[]> {
    return await db.select().from(exerciseTemplates);
  }

  async createExerciseTemplate(template: InsertExerciseTemplate): Promise<ExerciseTemplate> {
    const [newTemplate] = await db.insert(exerciseTemplates).values(template).returning();
    return newTemplate;
  }

  async updateExerciseTemplate(id: number, updates: Partial<InsertExerciseTemplate>): Promise<ExerciseTemplate> {
    const [updated] = await db.update(exerciseTemplates)
      .set(updates)
      .where(eq(exerciseTemplates.id, id))
      .returning();
    return updated;
  }

  async getBiomechanicalRules(templateId: number): Promise<BiomechanicalRule[]> {
    return await db.select().from(biomechanicalRules)
      .where(eq(biomechanicalRules.exerciseTemplateId, templateId));
  }

  async createBiomechanicalRule(rule: InsertBiomechanicalRule): Promise<BiomechanicalRule> {
    const [newRule] = await db.insert(biomechanicalRules).values(rule).returning();
    return newRule;
  }

  async getCorrectiveFeedback(templateId: number): Promise<CorrectiveFeedback[]> {
    return await db.select().from(correctiveFeedback)
      .where(eq(correctiveFeedback.exerciseTemplateId, templateId));
  }

  async createCorrectiveFeedback(feedback: InsertCorrectiveFeedback): Promise<CorrectiveFeedback> {
    const [newFeedback] = await db.insert(correctiveFeedback).values(feedback).returning();
    return newFeedback;
  }

  async getUserMovementAnalysis(userId: string, limit = 20): Promise<MovementAnalysis[]> {
    return await db
      .select()
      .from(movementAnalysis)
      .where(eq(movementAnalysis.userId, userId))
      .orderBy(desc(movementAnalysis.createdAt))
      .limit(limit);
  }

  // Subscription operations
  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User> {
    const updateData: any = { stripeCustomerId: customerId };
    if (subscriptionId) {
      updateData.stripeSubscriptionId = subscriptionId;
      updateData.subscriptionStatus = 'active';
    }
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateStripeCustomerId(userId: string, customerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
