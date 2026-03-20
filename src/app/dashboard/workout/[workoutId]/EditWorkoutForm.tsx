"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateWorkoutAction } from "./actions";

const COMMON_EXERCISES = [
  "Barbell Row",
  "Bench Press",
  "Bicep Curls",
  "Deadlift",
  "Dips",
  "Front Squat",
  "Incline Bench Press",
  "Lateral Raises",
  "Leg Press",
  "Lunges",
  "Overhead Press",
  "Pull-ups",
  "Romanian Deadlift",
  "Squat",
  "Tricep Extensions",
  "Tricep Pushdown",
];

type SetData = {
  reps: number;
  weightLbs: string;
};

type ExerciseData = {
  name: string;
  sets: SetData[];
};

type Props = {
  workoutId: string;
  workoutName: string;
  formattedDate: string;
  startedAt: Date;
  completedAt: Date | null;
  initialExercises: ExerciseData[];
};

export default function WorkoutLogger({
  workoutId,
  workoutName,
  formattedDate,
  startedAt,
  completedAt,
  initialExercises,
}: Props) {
  const router = useRouter();
  const [exercises, setExercises] = useState<ExerciseData[]>(initialExercises);
  // pending inputs for each exercise: weight and reps for the next set
  const [pendingInputs, setPendingInputs] = useState<{ weight: string; reps: string }[]>(
    () => initialExercises.map(() => ({ weight: "", reps: "" }))
  );
  // which set index is being edited per exercise (-1 = none)
  const [editingSet, setEditingSet] = useState<{ exIndex: number; setIndex: number } | null>(null);
  const [editInputs, setEditInputs] = useState({ weight: "", reps: "" });
  // exercise selector state
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [customExercise, setCustomExercise] = useState("");
  const [isCustomExercise, setIsCustomExercise] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save(updatedExercises: ExerciseData[], markComplete: boolean) {
    const saveable = updatedExercises.filter((ex) => ex.sets.length > 0);
    setSaving(true);
    await updateWorkoutAction({
      workoutId,
      name: workoutName,
      startedAt,
      completedAt: markComplete ? new Date() : (completedAt ?? startedAt),
      exercises: saveable.map((ex) => ({
        name: ex.name,
        sets: ex.sets.map((s, i) => ({
          setNumber: i + 1,
          reps: s.reps,
          weightLbs: s.weightLbs,
        })),
      })),
    });
    setSaving(false);
    if (markComplete) router.push("/dashboard");
    else router.refresh();
  }

  function addSet(exIndex: number) {
    const { weight, reps } = pendingInputs[exIndex];
    if (!weight || !reps) return;
    const updated = exercises.map((ex, i) =>
      i === exIndex
        ? { ...ex, sets: [...ex.sets, { reps: parseInt(reps, 10), weightLbs: weight }] }
        : ex
    );
    setExercises(updated);
    setPendingInputs((prev) =>
      prev.map((p, i) => (i === exIndex ? { weight: "", reps: "" } : p))
    );
    save(updated, false);
  }

  function deleteSet(exIndex: number, setIndex: number) {
    const updatedSets = exercises[exIndex].sets.filter((_, si) => si !== setIndex);
    let updated: ExerciseData[];
    if (updatedSets.length === 0) {
      // Remove the exercise entirely so save() has no empty exercises to skip
      updated = exercises.filter((_, i) => i !== exIndex);
      setPendingInputs((prev) => prev.filter((_, i) => i !== exIndex));
    } else {
      updated = exercises.map((ex, i) =>
        i === exIndex ? { ...ex, sets: updatedSets } : ex
      );
    }
    setExercises(updated);
    save(updated, false);
  }

  function startEditSet(exIndex: number, setIndex: number) {
    const set = exercises[exIndex].sets[setIndex];
    setEditingSet({ exIndex, setIndex });
    setEditInputs({ weight: set.weightLbs, reps: String(set.reps) });
  }

  function saveEditSet() {
    if (!editingSet) return;
    const { exIndex, setIndex } = editingSet;
    const updated = exercises.map((ex, i) =>
      i === exIndex
        ? {
            ...ex,
            sets: ex.sets.map((s, si) =>
              si === setIndex
                ? { reps: parseInt(editInputs.reps, 10), weightLbs: editInputs.weight }
                : s
            ),
          }
        : ex
    );
    setExercises(updated);
    setEditingSet(null);
    save(updated, false);
  }

  function removeExercise(exIndex: number) {
    const updated = exercises.filter((_, i) => i !== exIndex);
    setExercises(updated);
    setPendingInputs((prev) => prev.filter((_, i) => i !== exIndex));
    save(updated, false);
  }

  function confirmAddExercise() {
    const name = isCustomExercise ? customExercise.trim() : selectedExercise;
    if (!name) return;
    const updated = [...exercises, { name, sets: [] }];
    setExercises(updated);
    setPendingInputs((prev) => [...prev, { weight: "", reps: "" }]);
    setShowAddExercise(false);
    setSelectedExercise("");
    setCustomExercise("");
    setIsCustomExercise(false);
    // Don't save yet — exercise has no sets, will save when first set is added
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{workoutName || "Workout"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formattedDate}
            {completedAt ? <span> &bull; Completed</span> : <span> &bull; In Progress</span>}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            type="button"
            disabled={saving || exercises.filter((ex) => ex.sets.length > 0).length === 0}
            onClick={() => save(exercises, true)}
          >
            {saving ? "Saving..." : "Complete Workout"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
      {exercises.map((exercise, exIndex) => (
        <Card key={exIndex}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold">{exercise.name}</p>
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-destructive"
                onClick={() => removeExercise(exIndex)}
              >
                Remove
              </button>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-2 font-medium text-muted-foreground w-10">Set</th>
                  <th className="text-left pb-2 font-medium text-muted-foreground">Weight (lbs)</th>
                  <th className="text-left pb-2 font-medium text-muted-foreground">Reps</th>
                  <th className="text-right pb-2 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exercise.sets.map((set, setIndex) => {
                  const isEditing =
                    editingSet?.exIndex === exIndex && editingSet?.setIndex === setIndex;
                  return (
                    <tr key={setIndex} className="border-b border-border">
                      <td className="py-3 text-muted-foreground">{setIndex + 1}</td>
                      {isEditing ? (
                        <>
                          <td className="py-2 pr-2">
                            <Input
                              className="h-8 w-24"
                              placeholder="Weight"
                              value={editInputs.weight}
                              onChange={(e) =>
                                setEditInputs((p) => ({ ...p, weight: e.target.value }))
                              }
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <Input
                              className="h-8 w-20"
                              placeholder="Reps"
                              type="number"
                              min={1}
                              value={editInputs.reps}
                              onChange={(e) =>
                                setEditInputs((p) => ({ ...p, reps: e.target.value }))
                              }
                            />
                          </td>
                          <td className="py-2 text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" type="button" onClick={saveEditSet}>
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                type="button"
                                onClick={() => setEditingSet(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3">{set.weightLbs}</td>
                          <td className="py-3">{set.reps}</td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-3">
                              <button
                                type="button"
                                className="text-sm hover:underline"
                                onClick={() => startEditSet(exIndex, setIndex)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="text-sm hover:underline text-destructive"
                                onClick={() => deleteSet(exIndex, setIndex)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}

                {/* Pending row */}
                <tr>
                  <td className="py-3 text-muted-foreground">{exercise.sets.length + 1}</td>
                  <td className="py-2 pr-2">
                    <Input
                      className="h-8 w-24"
                      placeholder="Weight"
                      value={pendingInputs[exIndex]?.weight ?? ""}
                      onChange={(e) =>
                        setPendingInputs((prev) =>
                          prev.map((p, i) => (i === exIndex ? { ...p, weight: e.target.value } : p))
                        )
                      }
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Input
                      className="h-8 w-20"
                      placeholder="Reps"
                      type="number"
                      min={1}
                      value={pendingInputs[exIndex]?.reps ?? ""}
                      onChange={(e) =>
                        setPendingInputs((prev) =>
                          prev.map((p, i) => (i === exIndex ? { ...p, reps: e.target.value } : p))
                        )
                      }
                    />
                  </td>
                  <td className="py-2 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addSet(exIndex)}
                      disabled={!pendingInputs[exIndex]?.weight || !pendingInputs[exIndex]?.reps}
                    >
                      Add Set
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}

      {/* Add Exercise */}
      {showAddExercise ? (
        <Card>
          <CardContent className="pt-4 space-y-3">
            {isCustomExercise ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter exercise name"
                  value={customExercise}
                  onChange={(e) => setCustomExercise(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCustomExercise(false)}
                >
                  Back
                </Button>
              </div>
            ) : (
              <Select
                value={selectedExercise}
                onValueChange={(val) => {
                  if (val === "__custom__") {
                    setIsCustomExercise(true);
                    setSelectedExercise("");
                  } else {
                    setSelectedExercise(val);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an exercise" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_EXERCISES.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">Custom...</SelectItem>
                </SelectContent>
              </Select>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={confirmAddExercise}
                disabled={isCustomExercise ? !customExercise.trim() : !selectedExercise}
              >
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowAddExercise(false);
                  setSelectedExercise("");
                  setCustomExercise("");
                  setIsCustomExercise(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setShowAddExercise(true)}
        >
          + Add Exercise
        </Button>
      )}

      </div>
    </div>
  );
}
