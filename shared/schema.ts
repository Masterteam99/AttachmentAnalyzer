import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  fitnessLevel: integer("fitness_level").default(1),
  goals: text("goals"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("inactive"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workoutPlans = pgTable("workout_plans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  difficulty: integer("difficulty").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => workoutPlans.id),
  name: varchar("name").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // strength, cardio, flexibility
  difficulty: integer("difficulty").default(1),
  targetMuscles: text("target_muscles"),
  day: integer("day").notNull(),
  order: integer("order").notNull(),
  duration: integer("duration"), // in minutes
  sets: integer("sets"),
  reps: integer("reps"),
  weight: real("weight"),
});

// Exercise templates with reference videos and biomechanical rules
export const exerciseTemplates = pgTable("exercise_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  category: varchar("category").notNull(), // squat, pushup, lunge, etc
  description: text("description"),
  referenceVideoUrl: varchar("reference_video_url"), // URL to professional execution video
  referenceVideoKeypoints: jsonb("reference_video_keypoints"), // Stored MediaPipe keypoints
  difficulty: integer("difficulty").default(1),
  targetMuscles: text("target_muscles").array(),
  equipment: text("equipment").array(),
  instructions: text("instructions").array(),
  commonMistakes: text("common_mistakes").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Biomechanical rules for each exercise
export const biomechanicalRules = pgTable("biomechanical_rules", {
  id: serial("id").primaryKey(),
  exerciseTemplateId: integer("exercise_template_id").notNull().references(() => exerciseTemplates.id),
  ruleName: varchar("rule_name").notNull(),
  description: text("description"),
  ruleType: varchar("rule_type").notNull(), // angle, distance, ratio, sequence
  bodyParts: text("body_parts").array(), // which keypoints to check
  minValue: real("min_value"),
  maxValue: real("max_value"),
  severity: varchar("severity").default("medium"), // low, medium, high, critical
  correctionFeedback: text("correction_feedback"),
  isActive: boolean("is_active").default(true),
});

// Corrective feedback templates
export const correctiveFeedback = pgTable("corrective_feedback", {
  id: serial("id").primaryKey(),
  exerciseTemplateId: integer("exercise_template_id").notNull().references(() => exerciseTemplates.id),
  violatedRule: varchar("violated_rule"),
  feedbackType: varchar("feedback_type").notNull(), // form, breathing, tempo, range_of_motion
  message: text("message").notNull(),
  priority: integer("priority").default(1), // 1-5, higher = more important
  videoExample: varchar("video_example"), // URL to corrective demonstration
  isActive: boolean("is_active").default(true),
});

// Relations for new tables
export const exerciseTemplatesRelations = relations(exerciseTemplates, ({ many }) => ({
  biomechanicalRules: many(biomechanicalRules),
  correctiveFeedback: many(correctiveFeedback),
}));

export const biomechanicalRulesRelations = relations(biomechanicalRules, ({ one }) => ({
  exerciseTemplate: one(exerciseTemplates, {
    fields: [biomechanicalRules.exerciseTemplateId],
    references: [exerciseTemplates.id],
  }),
}));

export const correctiveFeedbackRelations = relations(correctiveFeedback, ({ one }) => ({
  exerciseTemplate: one(exerciseTemplates, {
    fields: [correctiveFeedback.exerciseTemplateId],
    references: [exerciseTemplates.id],
  }),
}));

// Type exports for new tables
export type ExerciseTemplate = typeof exerciseTemplates.$inferSelect;
export type InsertExerciseTemplate = typeof exerciseTemplates.$inferInsert;
export type BiomechanicalRule = typeof biomechanicalRules.$inferSelect;
export type InsertBiomechanicalRule = typeof biomechanicalRules.$inferInsert;
export type CorrectiveFeedback = typeof correctiveFeedback.$inferSelect;
export type InsertCorrectiveFeedback = typeof correctiveFeedback.$inferInsert;

export const workoutSessions = pgTable("workout_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").references(() => workoutPlans.id),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(),
  duration: integer("duration").notNull(), // in minutes
  caloriesBurned: integer("calories_burned"),
  intensity: varchar("intensity"), // low, medium, high
  completedAt: timestamp("completed_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // streak, perfectionist, explorer
  title: varchar("title").notNull(),
  description: text("description"),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  totalWorkouts: integer("total_workouts").default(0),
  totalCaloriesBurned: integer("total_calories_burned").default(0),
  weeklyGoal: integer("weekly_goal").default(4),
  weeklyProgress: integer("weekly_progress").default(0),
  lastWorkoutDate: timestamp("last_workout_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const wearableIntegrations = pgTable("wearable_integrations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: varchar("provider").notNull(), // fitbit, garmin, etc
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  lastSync: timestamp("last_sync"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const healthData = pgTable("health_data", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  dataType: varchar("data_type").notNull(), // heart_rate, steps, sleep, etc
  value: real("value").notNull(),
  unit: varchar("unit"),
  source: varchar("source"), // fitbit, manual, etc
  recordedAt: timestamp("recorded_at").defaultNow(),
});

export const movementAnalysis = pgTable("movement_analysis", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionId: integer("session_id").references(() => workoutSessions.id),
  exerciseName: varchar("exercise_name").notNull(),
  videoData: text("video_data"), // base64 or file path
  analysisResult: jsonb("analysis_result"),
  formScore: integer("form_score"), // 1-100
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  workoutPlans: many(workoutPlans),
  workoutSessions: many(workoutSessions),
  achievements: many(achievements),
  userStats: many(userStats),
  wearableIntegrations: many(wearableIntegrations),
  healthData: many(healthData),
  movementAnalysis: many(movementAnalysis),
}));

export const workoutPlansRelations = relations(workoutPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [workoutPlans.userId],
    references: [users.id],
  }),
  exercises: many(exercises),
  workoutSessions: many(workoutSessions),
}));

export const exercisesRelations = relations(exercises, ({ one }) => ({
  workoutPlan: one(workoutPlans, {
    fields: [exercises.planId],
    references: [workoutPlans.id],
  }),
}));

export const workoutSessionsRelations = relations(workoutSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [workoutSessions.userId],
    references: [users.id],
  }),
  workoutPlan: one(workoutPlans, {
    fields: [workoutSessions.planId],
    references: [workoutPlans.id],
  }),
  movementAnalysis: many(movementAnalysis),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

export const wearableIntegrationsRelations = relations(wearableIntegrations, ({ one }) => ({
  user: one(users, {
    fields: [wearableIntegrations.userId],
    references: [users.id],
  }),
}));

export const healthDataRelations = relations(healthData, ({ one }) => ({
  user: one(users, {
    fields: [healthData.userId],
    references: [users.id],
  }),
}));

export const movementAnalysisRelations = relations(movementAnalysis, ({ one }) => ({
  user: one(users, {
    fields: [movementAnalysis.userId],
    references: [users.id],
  }),
  workoutSession: one(workoutSessions, {
    fields: [movementAnalysis.sessionId],
    references: [workoutSessions.id],
  }),
}));

// Insert schemas - Using direct schema creation for better compatibility
export const insertUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().url().optional(),
  settings: z.record(z.any()).optional(),
});

export const insertWorkoutPlanSchema = z.object({
  userId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  exercises: z.array(z.any()),
  estimatedDuration: z.number(),
});

export const insertExerciseSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  category: z.string(),
  muscleGroups: z.array(z.string()),
  equipment: z.array(z.string()).optional(),
  instructions: z.array(z.string()).optional(),
});

export const insertWorkoutSessionSchema = z.object({
  userId: z.string(),
  workoutPlanId: z.string().optional(),
  exercises: z.array(z.any()),
  duration: z.number(),
  caloriesBurned: z.number().optional(),
  notes: z.string().optional(),
});

export const insertAchievementSchema = z.object({
  userId: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string(),
  points: z.number(),
  badgeUrl: z.string().optional(),
});

export const insertMovementAnalysisSchema = z.object({
  userId: z.string(),
  exerciseName: z.string(),
  videoUrl: z.string().optional(),
  keypoints: z.array(z.any()),
  formScore: z.number(),
  feedback: z.string(),
  corrections: z.array(z.string()),
  strengths: z.array(z.string()),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type InsertWorkoutPlan = z.infer<typeof insertWorkoutPlanSchema>;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserStats = typeof userStats.$inferSelect;
export type WearableIntegration = typeof wearableIntegrations.$inferSelect;
export type HealthData = typeof healthData.$inferSelect;
export type MovementAnalysis = typeof movementAnalysis.$inferSelect;
export type InsertMovementAnalysis = z.infer<typeof insertMovementAnalysisSchema>;
