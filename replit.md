# Workspace

## Project: Aman's Task & Payment Tracker

Expo (React Native) mobile app + Express API + PostgreSQL/Drizzle. Modern Opulence design system (#080808 matte black, #D4AF37 gold, #F4F4F4 pearl, Satoshi fonts).

**Implemented Features:**
- Auth: Mobile+Password, JWT, bcryptjs (NO OTP)
- Tasks: Create/update/delete with billed/received amounts, status, work_done, deadline, slip photos, history
- Finance tab: Monthly grouped earnings, collection ratio, outstanding dues, CSV export
- Udhaar Ledger: Passbook-style with Add/Reduce transactions, full/partial settle
- People/Contacts tab: Aggregated view by phone, unified activity timeline per person
- Contact Picker: expo-contacts integration for auto-filling person_name + phone in tasks + udhaar
- Animations: Reanimated v4 — login logo zoom/pulse, staggered list entry (FadeInRight), FAB rotation+spring, card press feedback
- DB schema: tasks(person_name, phone), udhaar(phone) columns added

**Test credentials:** 9999999999 / Test@1234

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
