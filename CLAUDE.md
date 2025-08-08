# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start both frontend (Next.js) and backend (Convex) development servers
- `npm run dev:frontend` - Start only Next.js development server  
- `npm run dev:backend` - Start only Convex development environment

### Build and Production
- `npm run build` - Create production build
- `npm run start` - Serve production build
- `npm run lint` - Run ESLint for code quality checks

### Testing
No test commands are currently configured. Consider adding test infrastructure if needed.

## Architecture Overview

This is a full-stack web application using the Convex + Next.js stack:

### Tech Stack
- **Frontend**: Next.js 15.2.3 with App Router, React 19, TypeScript
- **Backend**: Convex (serverless database and functions)
- **Styling**: Tailwind CSS v4 with PostCSS
- **Type Safety**: Full TypeScript with auto-generated Convex types

### Key Architectural Patterns

1. **Convex Backend Functions** (`/convex/`)
   - All backend logic lives in the `/convex/` directory
   - `schema.ts` defines the database schema - modify this to add new tables
   - Functions are organized as queries (read), mutations (write), and actions (side effects)
   - Types are auto-generated in `/convex/_generated/` - never edit these directly

2. **Next.js App Router** (`/app/`)
   - Uses the App Router pattern with `layout.tsx` and `page.tsx`
   - Server components can use `preloadQuery` for SSR data fetching
   - Client components use `useQuery` and `useMutation` hooks for reactive data

3. **Real-time Reactivity**
   - Convex provides automatic real-time updates
   - Data changes immediately reflect across all connected clients
   - No need to implement WebSockets or polling

4. **Type Safety Flow**
   - Define schema in `convex/schema.ts`
   - Write backend functions that use the schema
   - Auto-generated types provide end-to-end type safety
   - Frontend hooks are fully typed based on backend functions

### Development Workflow

When adding new features:
1. Define data models in `convex/schema.ts`
2. Create backend functions in `convex/` directory
3. Use the auto-generated API in React components
4. Style with Tailwind CSS inline classes

The Convex dashboard opens automatically during development for debugging and data inspection.