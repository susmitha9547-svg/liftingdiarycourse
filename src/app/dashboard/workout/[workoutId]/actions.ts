"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { updateWorkout } from "@/data/workouts";
import { revalidatePath } from "next/cache";

const setSchema = z.object({
  setNumber: z.number().int().min(1),
  reps: z.number().int().min(1),
  weightLbs: z.string().min(1),
});

const exerciseSchema = z.object({
  name: z.string().min(1).max(200),
  sets: z.array(setSchema).min(1),
});


const updateWorkoutSchema = z.object({
  workoutId: z.string().min(1),
  name: z.string().max(100),
  startedAt: z.coerce.date(),
  completedAt: z.coerce.date(),
  exercises: z.array(exerciseSchema),
});

export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;

export async function updateWorkoutAction(input: UpdateWorkoutInput) {
  const parsed = updateWorkoutSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  await updateWorkout(userId, parsed.data.workoutId, {
    name: parsed.data.name,
    startedAt: parsed.data.startedAt,
    completedAt: parsed.data.completedAt,
    exercises: parsed.data.exercises,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/workout/${parsed.data.workoutId}`);
}
