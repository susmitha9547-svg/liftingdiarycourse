"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarIcon, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Workout = {
  id: string;
  name: string | null;
  startedAt: Date;
  completedAt: Date | null;
};

type Props = {
  workouts: Workout[];
  selectedDate: Date;
};

export default function WorkoutList({ workouts, selectedDate }: Props) {
  const router = useRouter();
  const [date, setDate] = useState<Date>(selectedDate);
  const [open, setOpen] = useState(false);

  function handleDateChange(d: Date | undefined) {
    if (!d) return;
    setDate(d);
    setOpen(false);
    const iso = format(d, "yyyy-MM-dd");
    router.push(`/dashboard?date=${iso}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Workouts for {format(date, "do MMM yyyy")}</span>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/workout/new">
            <Button variant="outline">
              <Plus className="h-4 w-4" />
              Log New Workout
            </Button>
          </Link>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="whitespace-nowrap">
                <CalendarIcon className="h-4 w-4" />
                {format(date, "do MMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Card className="flex-1">
        <CardContent className="pt-6">
          {workouts.length === 0 ? (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                No workouts logged for this date.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {workouts.map((workout) => {
                const duration =
                  workout.completedAt
                    ? Math.round(
                        (workout.completedAt.getTime() -
                          workout.startedAt.getTime()) /
                          60000
                      ) + " min"
                    : "In progress";

                return (
                  <li key={workout.id}>
                    <Link href={`/dashboard/workout/${workout.id}`}>
                      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">
                              {workout.name ?? "Unnamed Workout"}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {format(workout.startedAt, "hh:mm a")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Duration: {duration}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
