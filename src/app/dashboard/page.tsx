"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MOCK_WORKOUTS = [
  { id: 1, name: "Bench Press", sets: 4, reps: 8, weight: "80kg", time: "07:00 AM", duration: "45 min" },
  { id: 2, name: "Squat", sets: 3, reps: 5, weight: "100kg", time: "08:00 AM", duration: "30 min" },
  { id: 3, name: "Deadlift", sets: 3, reps: 5, weight: "120kg", time: "08:35 AM", duration: "25 min" },
];

export default function DashboardPage() {
  const [date, setDate] = useState<Date>(new Date());

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Workout Dashboard</h1>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
            />
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>
              Workouts for {format(date, "do MMM yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {MOCK_WORKOUTS.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No workouts logged for this date.
              </p>
            ) : (
              <ul className="space-y-3">
                {MOCK_WORKOUTS.map((workout) => (
                  <li key={workout.id}>
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{workout.name}</p>
                          <span className="text-xs text-muted-foreground">{workout.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {workout.sets} sets × {workout.reps} reps @ {workout.weight}
                        </p>
                        <p className="text-sm text-muted-foreground">Duration: {workout.duration}</p>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
