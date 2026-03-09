# Data Mutations

## CRITICAL RULES

### 1. Mutations via `/data` Helper Functions Only

ALL database mutations (insert, update, delete) MUST go through helper functions located in the `src/data/` directory. These helpers use **Drizzle ORM** — raw SQL is strictly forbidden.

**NEVER mutate data via:**
- Direct `db` calls inside components, route handlers, or server actions
- Raw SQL
- Route handlers (`/app/api/` routes)

**ALWAYS mutate data by:**
- Calling a `src/data/` helper function from a server action

```ts
// ✅ CORRECT — mutation wrapped in a /data helper
// src/data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";

export async function createWorkout(userId: string, name: string, date: Date) {
  const [workout] = await db
    .insert(workouts)
    .values({ userId, name, date })
    .returning();
  return workout;
}

// ❌ WRONG — direct db call inside a server action
"use server";
export async function createWorkoutAction(data: CreateWorkoutInput) {
  await db.insert(workouts).values({ ...data }); // DO NOT DO THIS
}
```

### 2. All Server Actions in `actions.ts`

Every server action MUST live in a file named **`actions.ts`** co-located with the feature it belongs to (e.g. `src/app/workouts/actions.ts`).

- Each file MUST have `"use server"` at the top.
- No server actions in component files, `page.tsx`, or `layout.tsx`.

```ts
// ✅ CORRECT
// src/app/workouts/actions.ts
"use server";

export async function createWorkoutAction(...) { ... }
export async function deleteWorkoutAction(...) { ... }

// ❌ WRONG — server action defined in a component or page
// src/app/workouts/page.tsx
export async function createWorkout() { // DO NOT DO THIS
  "use server";
  ...
}
```

### 3. Typed Params — No `FormData`

All server action parameters MUST be explicitly typed using TypeScript types or interfaces. `FormData` is strictly forbidden as a parameter type.

```ts
// ✅ CORRECT — typed params
type CreateWorkoutInput = {
  name: string;
  date: Date;
};

export async function createWorkoutAction(input: CreateWorkoutInput) { ... }

// ❌ WRONG — FormData param
export async function createWorkoutAction(formData: FormData) { ... }
```

### 4. Validate All Inputs with Zod

Every server action MUST validate its arguments using **Zod** before doing anything else. Never trust caller-supplied data.

```ts
// ✅ CORRECT — zod validation at the top of every action
"use server";

import { z } from "zod";
import { createWorkout } from "@/data/workouts";
import { auth } from "@/auth";

const createWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.coerce.date(),
});

type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

export async function createWorkoutAction(input: CreateWorkoutInput) {
  const parsed = createWorkoutSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid input");
  }

  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");

  return createWorkout(session.user.id, parsed.data.name, parsed.data.date);
}

// ❌ WRONG — no validation
export async function createWorkoutAction(input: CreateWorkoutInput) {
  return createWorkout(input.userId, input.name, input.date); // unsafe
}
```

### 5. No `redirect()` in Server Actions

Never call `redirect()` inside a server action. Redirects must be handled client-side by calling `router.push()` after the server action resolves.

```ts
// ✅ CORRECT — redirect handled in the client component
"use client";
import { useRouter } from "next/navigation";

const router = useRouter();

async function onSubmit(values: FormValues) {
  await createWorkoutAction(values);
  router.push("/dashboard"); // redirect after action resolves
}

// ❌ WRONG — redirect inside a server action
"use server";
import { redirect } from "next/navigation";

export async function createWorkoutAction(input: CreateWorkoutInput) {
  // ...
  redirect("/dashboard"); // DO NOT DO THIS
}
```

### 6. Users Can ONLY Mutate Their Own Data

Every server action that writes user-specific data MUST verify the authenticated user's session and scope the mutation to their ID. Never accept a `userId` from the caller.

```ts
// ✅ CORRECT — userId comes from the session, never from input
export async function deleteWorkoutAction(input: { workoutId: string }) {
  const parsed = deleteWorkoutSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");

  return deleteWorkout(session.user.id, parsed.data.workoutId);
}

// ❌ WRONG — trusting a userId from the caller
export async function deleteWorkoutAction(input: { userId: string; workoutId: string }) {
  return deleteWorkout(input.userId, input.workoutId); // any user can delete any record!
}
```

## Full Example

```ts
// src/data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function createWorkout(userId: string, name: string, date: Date) {
  const [workout] = await db
    .insert(workouts)
    .values({ userId, name, date })
    .returning();
  return workout;
}

export async function deleteWorkout(userId: string, workoutId: string) {
  await db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
}
```

```ts
// src/app/workouts/actions.ts
"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { createWorkout, deleteWorkout } from "@/data/workouts";

const createWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.coerce.date(),
});

const deleteWorkoutSchema = z.object({
  workoutId: z.string().uuid(),
});

type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
type DeleteWorkoutInput = z.infer<typeof deleteWorkoutSchema>;

export async function createWorkoutAction(input: CreateWorkoutInput) {
  const parsed = createWorkoutSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");

  return createWorkout(session.user.id, parsed.data.name, parsed.data.date);
}

export async function deleteWorkoutAction(input: DeleteWorkoutInput) {
  const parsed = deleteWorkoutSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");

  return deleteWorkout(session.user.id, parsed.data.workoutId);
}
```

## Summary Checklist

| Rule | Required |
|------|----------|
| All DB mutations via `src/data/` helper functions | ✅ Always |
| Use Drizzle ORM (no raw SQL) | ✅ Always |
| All server actions in a file named `actions.ts` | ✅ Always |
| `"use server"` at the top of every `actions.ts` | ✅ Always |
| Typed params on all server actions | ✅ Always |
| Validate all inputs with Zod | ✅ Always |
| Scope all mutations to the authenticated user's ID | ✅ Always |
| `FormData` as a server action param type | ❌ Never |
| Direct `db` calls in server actions | ❌ Never |
| Accepting `userId` from caller input | ❌ Never |
| Raw SQL | ❌ Never |
| Server actions in route handlers | ❌ Never |
| `redirect()` inside server actions | ❌ Never |
