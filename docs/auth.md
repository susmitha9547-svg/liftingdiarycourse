# Auth Coding Standards

## Authentication Provider

**This app uses [Clerk](https://clerk.com/) exclusively for authentication.**

- Do NOT implement custom auth logic (sessions, JWTs, password hashing, etc.).
- Do NOT use NextAuth, Auth.js, Lucia, or any other auth library.
- All authentication is handled entirely by Clerk.

---

## CRITICAL RULES

### 1. Reading the Current User

Always use Clerk's server-side helpers to get the authenticated user. Never trust client-supplied user IDs.

```ts
// ✅ CORRECT — server-side, in a Server Component or /data helper
import { auth } from "@clerk/nextjs/server";

const { userId } = await auth();
if (!userId) throw new Error("Unauthenticated");
```

```ts
// ❌ WRONG — never read auth state from the client and pass it as trusted input
const userId = searchParams.get("userId"); // untrusted — do not use as an auth ID
```

### 2. Protecting Pages

Use Clerk middleware to protect routes. Do not manually guard every page with redirect logic.

```ts
// middleware.ts (project root)
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) auth().protect();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
```

- Public routes (marketing, sign-in, sign-up) must be explicitly listed in `isPublicRoute`.
- All other routes are protected by default.

### 3. Sign-In and Sign-Up Pages

Use Clerk's prebuilt components. Do not build custom auth forms.

```tsx
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return <SignIn />;
}
```

```tsx
// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return <SignUp />;
}
```

### 4. User ID in Database Queries

Every database record tied to a user MUST store and filter by Clerk's `userId` string (e.g. `"user_2abc..."`). Do not store email or username as the user identifier.

```ts
// ✅ CORRECT — scope queries to Clerk's userId
import { auth } from "@clerk/nextjs/server";

export async function getWorkouts() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  return db.select().from(workouts).where(eq(workouts.userId, userId));
}
```

```ts
// ❌ WRONG — using email or an untrusted ID
eq(workouts.userEmail, session.email)
```

### 5. Displaying the Current User in the UI

Use Clerk's client-side hooks and components only for display purposes (avatars, names). Never use them to gate data access — that must happen server-side.

```tsx
// ✅ CORRECT — display only
"use client";
import { UserButton, useUser } from "@clerk/nextjs";

export function Header() {
  const { user } = useUser();
  return (
    <header>
      <span>{user?.firstName}</span>
      <UserButton />
    </header>
  );
}
```

```tsx
// ❌ WRONG — using client-side auth to decide what data to fetch
"use client";
const { userId } = useAuth();
fetch(`/api/workouts?userId=${userId}`); // never do this
```

---

## Summary Checklist

| Rule | Required |
|------|----------|
| Use Clerk for all authentication | ✅ Always |
| Protect routes via Clerk middleware | ✅ Always |
| Read `userId` server-side with `auth()` from `@clerk/nextjs/server` | ✅ Always |
| Scope every DB query to the authenticated `userId` | ✅ Always |
| Use Clerk's prebuilt `<SignIn />` / `<SignUp />` components | ✅ Always |
| Use custom auth libraries (NextAuth, Lucia, etc.) | ❌ Never |
| Trust client-supplied user IDs for data access | ❌ Never |
| Build custom sign-in/sign-up forms | ❌ Never |
| Use email or username as the primary user identifier in the DB | ❌ Never |
