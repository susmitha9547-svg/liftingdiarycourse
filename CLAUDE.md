# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

This is a **Next.js App Router** project (Next.js 16, React 19, TypeScript, Tailwind CSS v4).

- `src/app/` — App Router directory. `layout.tsx` is the root layout; `page.tsx` is the home route.
- Path alias `@/*` maps to `./src/*`.
- Tailwind CSS v4 is configured via PostCSS (`postcss.config.mjs`); global styles are in `src/app/globals.css`.
- CSS custom properties (`--background`, `--foreground`) handle light/dark theming.
- Geist fonts (sans and mono) are loaded via `next/font` in the root layout and exposed as CSS variables.

All components default to React Server Components unless `"use client"` is declared at the top of the file.

## CODE GENERATION RULES

**IMPORTANT:** Before generating any code, always check the `/docs` directory for relevant documentation files. If a docs file exists for the feature or area you are working on, you MUST read and follow it before writing any code. The `/docs` directory contains project-specific requirements, conventions, and design decisions that take precedence over general best practices.

- /docs/ui.md
- /docs/data-fetching.md 
