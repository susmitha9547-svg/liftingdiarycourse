import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { workouts, exercises, workoutExercises, sets } from "@/db/schema";
import { eq, and, gte, lt, asc } from "drizzle-orm";

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

export async function getWorkout(workoutId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));

  if (!workout) return null;

  const workoutExerciseRows = await db
    .select()
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId))
    .orderBy(asc(workoutExercises.order));

  const exercisesWithSets = await Promise.all(
    workoutExerciseRows.map(async (we) => {
      const [exercise] = await db
        .select()
        .from(exercises)
        .where(eq(exercises.id, we.exerciseId));

      const setRows = await db
        .select()
        .from(sets)
        .where(eq(sets.workoutExerciseId, we.id))
        .orderBy(asc(sets.setNumber));

      return {
        workoutExerciseId: we.id,
        name: exercise.name,
        sets: setRows.map((s) => ({
          id: s.id,
          setNumber: s.setNumber,
          reps: s.reps ?? 0,
          weightLbs: s.weightLbs ?? "0",
        })),
      };
    })
  );

  return { ...workout, exercises: exercisesWithSets };
}

export async function updateWorkout(
  userId: string,
  workoutId: string,
  input: {
    name: string;
    startedAt: Date;
    completedAt: Date;
    exercises: ExerciseInput[];
  }
) {
  const [existing] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));

  if (!existing) throw new Error("Workout not found");

  await db
    .update(workouts)
    .set({ name: input.name, startedAt: input.startedAt, completedAt: input.completedAt })
    .where(eq(workouts.id, workoutId));

  // Delete existing workout exercises and sets, then re-insert
  const existingWEs = await db
    .select()
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId));

  for (const we of existingWEs) {
    await db.delete(sets).where(eq(sets.workoutExerciseId, we.id));
  }
  await db.delete(workoutExercises).where(eq(workoutExercises.workoutId, workoutId));

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
      .values({ workoutId, exerciseId: exercise.id, order: i + 1 })
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
