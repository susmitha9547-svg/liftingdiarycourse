import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getWorkout } from "@/data/workouts";
import WorkoutLogger from "./EditWorkoutFormClient";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;
  const workout = await getWorkout(workoutId);

  if (!workout) notFound();

  const initialExercises = workout.exercises.map((ex) => ({
    name: ex.name,
    sets: ex.sets.map((s) => ({
      reps: s.reps,
      weightLbs: s.weightLbs,
    })),
  }));

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <WorkoutLogger
        workoutId={workoutId}
        workoutName={workout.name ?? ""}
        formattedDate={format(workout.startedAt, "do MMM yyyy")}
        startedAt={workout.startedAt}
        completedAt={workout.completedAt ?? null}
        initialExercises={initialExercises}
      />
    </div>
  );
}
