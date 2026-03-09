"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { workouts, workoutExercises, exercises, sets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type SetInput = {
  setNumber: number;
  reps: number;
  weightLbs: string;
};

type ExerciseInput = {
  name: string;
  sets: SetInput[];
};

type LogWorkoutInput = {
  name: string;
  startedAt: Date;
  completedAt: Date;
  exercises: ExerciseInput[];
};

export async function logWorkout(input: LogWorkoutInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

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

    // Upsert exercise by name
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
      .values({
        workoutId: workout.id,
        exerciseId: exercise.id,
        order: i + 1,
      })
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

  revalidatePath("/dashboard");
}
