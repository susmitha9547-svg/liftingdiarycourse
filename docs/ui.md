# UI Coding Standards

## Component Library

**All UI components must use [shadcn/ui](https://ui.shadcn.com/) exclusively.**

- Do NOT create custom UI components.
- Do NOT use raw HTML elements for UI (buttons, inputs, cards, dialogs, etc.) when a shadcn/ui equivalent exists.
- Install shadcn/ui components via the CLI: `npx shadcn@latest add <component>`
- Import components from `@/components/ui/<component>`.

This rule applies project-wide with no exceptions. If a shadcn/ui component does not cover your use case, compose existing shadcn/ui primitives together rather than building something custom.

## Date Formatting

Use [`date-fns`](https://date-fns.org/) for all date formatting. Do not use `Date.toLocaleDateString`, `Intl.DateTimeFormat`, or any other date library.

### Required Format

Dates must be displayed in the following format:

```
1st Sep 2025
2nd Aug 2025
3rd Jan 2026
4th Jun 2024
```

### Implementation

Use the `do MMM yyyy` format string with `date-fns/format`:

```ts
import { format } from "date-fns";

format(new Date("2025-09-01"), "do MMM yyyy"); // "1st Sep 2025"
format(new Date("2025-08-02"), "do MMM yyyy"); // "2nd Aug 2025"
format(new Date("2026-01-03"), "do MMM yyyy"); // "3rd Jan 2026"
format(new Date("2024-06-04"), "do MMM yyyy"); // "4th Jun 2024"
```

Create a shared utility if the same format is needed in multiple places:

```ts
// src/lib/format-date.ts
import { format } from "date-fns";

export function formatDate(date: Date | string): string {
  return format(new Date(date), "do MMM yyyy");
}
```
