# Routing Standards

## Route Structure

All application routes must be nested under `/dashboard`.

```
/dashboard          → Dashboard home
/dashboard/[...]    → All other app pages
```

The root `/` route is reserved for marketing/landing pages or redirects.

## Protected Routes

All `/dashboard` routes are protected and require an authenticated user.

Route protection is enforced via **Next.js Middleware** (`middleware.ts` at the project root). Do not implement per-page auth guards or redirects inside individual page components.

```ts
// middleware.ts
export const config = {
  matcher: ["/dashboard/:path*"],
};
```

The middleware must:
1. Check for a valid user session
2. Redirect unauthenticated users to the login page (e.g. `/login`)
3. Allow authenticated users through

## Rules

- **Never** protect routes inside page components or layouts — always use middleware.
- **Never** create top-level app routes outside of `/dashboard` for authenticated features.
- The middleware is the single source of truth for route protection.
