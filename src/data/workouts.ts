import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { workouts, exercises, workoutExercises, sets } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";

export type SetInput = {
  setNumber: number;
  reps: number;
  weightLbs: string;
};

export type ExerciseInput = {
  name: string;
  sets: SetInput[];
};

export async function createWorkout(
  userId: string,
  input: {
    name: string;
    startedAt: Date;
    completedAt: Date;
    exercises: ExerciseInput[];
  }
) {
  const [workout] = await db
    .insert(workouts)
    .values({
      userId,
      name: input.name,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
    })
    .returning();

  for (let i = 0; i < input.exercises.length; i++) {
    const exerciseInput = input.exercises[i];

    let [exercise] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.name, exerciseInput.name));

    if (!exercise) {
      [exercise] = await db
        .insert(exercises)
        .values({ name: exerciseInput.name })
        .returning();
    }

    const [workoutExercise] = await db
      .insert(workoutExercises)
      .values({ workoutId: workout.id, exerciseId: exercise.id, order: i + 1 })
      .returning();

    await db.insert(sets).values(
      exerciseInput.sets.map((s) => ({
        workoutExerciseId: workoutExercise.id,
        setNumber: s.setNumber,
        reps: s.reps,
        weightLbs: s.weightLbs,
      }))
    );
  }

  return workout;
}

export async function getWorkoutsForDate(date: Date) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));

  return db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.startedAt, start),
        lt(workouts.startedAt, end)
      )
    );
}
