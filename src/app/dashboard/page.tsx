import { getWorkoutsForDate } from "@/data/workouts";
import WorkoutList from "./WorkoutList";

type Props = {
  searchParams: Promise<{ date?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const { date: dateParam } = await searchParams;
  const selectedDate = dateParam ? new Date(dateParam) : new Date();

  const workouts = await getWorkoutsForDate(selectedDate);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Workout Dashboard</h1>
      <WorkoutList workouts={workouts} selectedDate={selectedDate} />
    </div>
  );
}
