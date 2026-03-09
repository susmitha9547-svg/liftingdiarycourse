# Data Fetching

## CRITICAL RULES

### 1. Server Components ONLY

ALL data fetching in this app MUST be done via **React Server Components**.

**NEVER fetch data via:**
- Route handlers (`/app/api/` routes)
- Client components (`"use client"` files)
- `useEffect` + `fetch`
- SWR, React Query, or any client-side data fetching library

**ALWAYS fetch data by:**
- Calling helper functions directly inside Server Components
- Passing data down as props to Client Components that need it

```tsx
// ✅ CORRECT — fetch in a Server Component
// app/workouts/page.tsx
import { getWorkouts } from "@/data/workouts";

export default async function WorkoutsPage() {
  const workouts = await getWorkouts();
  return <WorkoutList workouts={workouts} />;
}

// ❌ WRONG — never fetch in a Client Component
"use client";
export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState([]);
  useEffect(() => {
    fetch("/api/workouts").then(...); // DO NOT DO THIS
  }, []);
}
```

### 2. Database Queries via `/data` Helpers Only

All database queries MUST go through helper functions located in the `/data` directory. These helpers use **Drizzle ORM** — raw SQL is strictly forbidden.

```ts
// ✅ CORRECT — Drizzle ORM query in a /data helper
// data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getWorkouts(userId: string) {
  return db.select().from(workouts).where(eq(workouts.userId, userId));
}

// ❌ WRONG — raw SQL
db.execute(sql`SELECT * FROM workouts WHERE user_id = ${userId}`);

// ❌ WRONG — querying the DB directly from a component or route handler
```

### 3. Users Can ONLY Access Their Own Data

This is a **security requirement**. Every `/data` helper function that reads user-specific data MUST scope the query to the authenticated user's ID.

- Always retrieve the current user's session/ID inside the helper (or receive it as a parameter verified by the caller).
- Always include a `WHERE userId = currentUserId` condition in every query.
- **Never** trust user-supplied IDs from URL params or request bodies without verifying they match the authenticated user.

```ts
// ✅ CORRECT — always filter by the authenticated user's ID
import { auth } from "@/auth";

export async function getWorkout(workoutId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");

  const [workout] = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, session.user.id) // ← REQUIRED on every query
      )
    );

  return workout ?? null;
}

// ❌ WRONG — fetching a record without scoping to the current user
export async function getWorkout(workoutId: string) {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(eq(workouts.id, workoutId)); // any user can access any record!
  return workout;
}
```

## Summary Checklist

| Rule | Required |
|------|----------|
| Fetch data in Server Components | ✅ Always |
| Use `/data` helper functions for all DB access | ✅ Always |
| Use Drizzle ORM (no raw SQL) | ✅ Always |
| Scope every query to the authenticated user's ID | ✅ Always |
| Fetch data in Client Components | ❌ Never |
| Fetch data in Route Handlers | ❌ Never |
| Use raw SQL | ❌ Never |
| Access another user's data | ❌ Never |
