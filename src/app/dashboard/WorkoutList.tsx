"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from "next/dynamic";

const LogWorkoutDialog = dynamic(() => import("./LogWorkoutDialog"), {
  ssr: false,
});

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

  function handleDateChange(d: Date | undefined) {
    if (!d) return;
    setDate(d);
    const iso = format(d, "yyyy-MM-dd");
    router.push(`/dashboard?date=${iso}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateChange}
          />
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Workouts for {format(date, "do MMM yyyy")}</CardTitle>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                No workouts logged for this date.
              </p>
              <LogWorkoutDialog selectedDate={date} />
            </div>
          ) : (
            <>
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
                              {format(new Date(workout.startedAt.toISOString().replace("Z", "")), "hh:mm a")} UTC
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
            <LogWorkoutDialog selectedDate={date} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
