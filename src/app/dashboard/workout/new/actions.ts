"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { createWorkout } from "@/data/workouts";
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

const createWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  startedAt: z.coerce.date(),
  completedAt: z.coerce.date(),
  exercises: z.array(exerciseSchema).min(1),
});

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

export async function createWorkoutAction(input: CreateWorkoutInput) {
  const parsed = createWorkoutSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  await createWorkout(userId, parsed.data);

  revalidatePath("/dashboard");
}
