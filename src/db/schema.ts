import { pgTable, uuid, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

export const workouts = pgTable("workouts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  name: text("name"),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const workoutExercises = pgTable("workout_exercises", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workoutId: uuid("workout_id").notNull().references(() => workouts.id),
  exerciseId: uuid("exercise_id").notNull().references(() => exercises.id),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const sets = pgTable("sets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workoutExerciseId: uuid("workout_exercise_id").notNull().references(() => workoutExercises.id),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps"),
  weightLbs: numeric("weight_lbs"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});


//Relations
export const workoutRelations = relations(workouts, ({many }) => ({workoutExercises: many(workoutExercises),}));
export const exercisesRelations = relations(exercises, ({many }) => ({workoutExercises: many(workoutExercises),}));