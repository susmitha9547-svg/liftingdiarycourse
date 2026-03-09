# Server Components

## CRITICAL RULES

### 1. `params` and `searchParams` MUST Be Awaited

This is a **Next.js 15** project. `params` and `searchParams` are now **Promises** and MUST be awaited before accessing any properties. Accessing them synchronously will result in a build error or runtime bug.

```tsx
// ✅ CORRECT — params is awaited
export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;
  // use workoutId...
}

// ❌ WRONG — params accessed synchronously (Next.js 14 style)
export default async function WorkoutPage({
  params,
}: {
  params: { workoutId: string };
}) {
  const { workoutId } = params; // DO NOT DO THIS
}
```

This applies to **both** `params` and `searchParams`:

```tsx
// ✅ CORRECT — searchParams is awaited
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  const { q } = await searchParams;
}
```

### 2. Server Components Are `async` by Default

All Server Components that fetch data or await `params`/`searchParams` MUST be declared as `async` functions.

```tsx
// ✅ CORRECT
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);
  return <div>{data.name}</div>;
}

// ❌ WRONG — cannot await inside a non-async component
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // syntax error
}
```

### 3. Type `params` and `searchParams` as Promises

Always use `Promise<{ ... }>` as the type for `params` and `searchParams` in page and layout components. Never type them as plain objects.

```tsx
// ✅ CORRECT — typed as Promise
type Props = {
  params: Promise<{ workoutId: string }>;
  searchParams: Promise<{ date: string }>;
};

// ❌ WRONG — typed as plain object (Next.js 14 style)
type Props = {
  params: { workoutId: string };
  searchParams: { date: string };
};
```

### 4. Never Pass `params` to Client Components Without Awaiting First

Always resolve `params` in the Server Component and pass the resolved values as props to any Client Components.

```tsx
// ✅ CORRECT — resolved value passed to client component
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientComponent id={id} />;
}

// ❌ WRONG — passing the Promise directly to a client component
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ClientComponent params={params} />; // DO NOT DO THIS
}
```

## Summary Checklist

| Rule | Required |
|------|----------|
| Type `params` as `Promise<{ ... }>` | ✅ Always |
| `await params` before accessing properties | ✅ Always |
| Type `searchParams` as `Promise<{ ... }>` | ✅ Always |
| `await searchParams` before accessing properties | ✅ Always |
| Declare data-fetching Server Components as `async` | ✅ Always |
| Pass resolved values (not Promises) to Client Components | ✅ Always |
| Accessing `params` synchronously without awaiting | ❌ Never |
| Typing `params` as a plain object | ❌ Never |
