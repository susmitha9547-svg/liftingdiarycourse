import NewWorkoutForm from "./NewWorkoutForm";

export default function NewWorkoutPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">New Workout</h1>
      <NewWorkoutForm />
    </div>
  );
}
