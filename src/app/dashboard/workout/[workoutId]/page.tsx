import { notFound } from "next/navigation";
import { getWorkout } from "@/data/workouts";
import EditWorkoutForm from "./EditWorkoutFormClient";

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;
  const workout = await getWorkout(workoutId);

  if (!workout) notFound();

  const defaultValues = {
    name: workout.name ?? "",
    startedAt: toDatetimeLocal(workout.startedAt),
    completedAt: workout.completedAt ? toDatetimeLocal(workout.completedAt) : toDatetimeLocal(workout.startedAt),
    exercises: workout.exercises.map((ex) => ({
      name: ex.name,
      sets: ex.sets.map((s) => ({
        reps: String(s.reps),
        weightLbs: String(s.weightLbs),
      })),
    })),
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Edit Workout</h1>
      <EditWorkoutForm workoutId={workoutId} defaultValues={defaultValues} />
    </div>
  );
}
