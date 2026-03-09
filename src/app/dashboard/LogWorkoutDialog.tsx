"use client";

import { useState } from "react";
import { useForm, useFieldArray, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { logWorkout } from "./actions";

const setSchema = z.object({
  reps: z.string().min(1, "Required"),
  weightLbs: z.string().min(1, "Required"),
});

const exerciseSchema = z.object({
  name: z.string().min(1, "Exercise name required"),
  sets: z.array(setSchema).min(1, "Add at least one set"),
});

const formSchema = z.object({
  name: z.string().min(1, "Workout name required"),
  startedAt: z.string().min(1, "Required"),
  completedAt: z.string().min(1, "Required"),
  exercises: z.array(exerciseSchema).min(1, "Add at least one exercise"),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  selectedDate: Date;
};

export default function LogWorkoutDialog({ selectedDate }: Props) {
  const [open, setOpen] = useState(false);
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      startedAt: `${dateStr}T07:00`,
      completedAt: `${dateStr}T08:00`,
      exercises: [{ name: "", sets: [{ reps: "", weightLbs: "" }] }],
    },
  });

  const {
    fields: exerciseFields,
    append: appendExercise,
    remove: removeExercise,
  } = useFieldArray({ control: form.control, name: "exercises" });

  async function onSubmit(values: FormValues) {
    await logWorkout({
      name: values.name,
      startedAt: new Date(values.startedAt),
      completedAt: new Date(values.completedAt),
      exercises: values.exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets.map((s, i) => ({
          setNumber: i + 1,
          reps: parseInt(s.reps, 10),
          weightLbs: s.weightLbs,
        })),
      })),
    });
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-2">
          <Plus className="w-4 h-4 mr-2" />
          Log New Workout
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log New Workout</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workout Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Push Day" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Started At</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="completedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Completed At</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium">Exercises</p>

              {exerciseFields.map((exField, exIndex) => (
                <ExerciseFields
                  key={exField.id}
                  form={form}
                  exIndex={exIndex}
                  onRemove={() => removeExercise(exIndex)}
                  canRemove={exerciseFields.length > 1}
                />
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendExercise({ name: "", sets: [{ reps: "", weightLbs: "" }] })
                }
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Exercise
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Saving..." : "Save Workout"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ExerciseFields({
  form,
  exIndex,
  onRemove,
  canRemove,
}: {
  form: UseFormReturn<FormValues>;
  exIndex: number;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const {
    fields: setFields,
    append: appendSet,
    remove: removeSet,
  } = useFieldArray({
    control: form.control,
    name: `exercises.${exIndex}.sets`,
  });

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <FormField
            control={form.control}
            name={`exercises.${exIndex}.name`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    placeholder="Exercise name (e.g. Bench Press)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs text-muted-foreground px-1">
            <span>Reps</span>
            <span>Weight (lbs)</span>
            <span />
          </div>

          {setFields.map((setField, setIndex) => (
            <div
              key={setField.id}
              className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start"
            >
              <FormField
                control={form.control}
                name={`exercises.${exIndex}.sets.${setIndex}.reps`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="number" min={1} placeholder="8" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`exercises.${exIndex}.sets.${setIndex}.weightLbs`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="135" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSet(setIndex)}
                disabled={setFields.length === 1}
              >
                <Trash2 className="w-3 h-3 text-muted-foreground" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => appendSet({ reps: "", weightLbs: "" })}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Set
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
