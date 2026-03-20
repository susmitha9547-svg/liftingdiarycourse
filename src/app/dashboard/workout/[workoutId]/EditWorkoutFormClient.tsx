"use client";

import dynamic from "next/dynamic";

const WorkoutLogger = dynamic(() => import("./EditWorkoutForm"), { ssr: false });

export default WorkoutLogger;
