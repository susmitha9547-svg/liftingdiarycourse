"use client";

import dynamic from "next/dynamic";

const EditWorkoutForm = dynamic(() => import("./EditWorkoutForm"), { ssr: false });

export default EditWorkoutForm;
