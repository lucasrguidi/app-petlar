# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PetLar is a full-stack TypeScript monorepo built with:
- **Package Manager**: pnpm with workspaces
- **Monorepo Tool**: Turborepo
- **Frontend**: Next.js 16 (App Router) with React 19
- **Backend**: tRPC API
- **Database**: LibSQL/Turso (SQLite) with Drizzle ORM
- **Authentication**: Better Auth with email/password
- **Styling**: Tailwind CSS v4

## Monorepo Structure

```
apps/
  web/              # Next.js web application (port 3001)
packages/
  api/              # tRPC router and procedures
  auth/             # Better Auth configuration
  db/               # Drizzle ORM schemas and database client
  env/              # Environment variable validation
  config/           # Shared ESLint, Prettier, and TypeScript configs
```

## Development Commands

### Workspace Commands (from root)
```bash
# Development
pnpm dev                    # Run all apps in development mode
pnpm dev:web                # Run only web app (port 3001)
pnpm build                  # Build all packages and apps

# Code Quality
pnpm lint                   # Lint all packages
pnpm lint:fix               # Fix linting issues
pnpm format                 # Format all files with Prettier
pnpm format:check           # Check formatting without modifying
pnpm check-types            # Type check all packages

# Database (run from root)
pnpm db:local               # Start local Turso database (local.db)
pnpm db:push                # Push schema changes to database
pnpm db:generate --name X   # Generate migrations (always use descriptive name)
pnpm db:migrate             # Run migrations
pnpm db:studio              # Open Drizzle Studio
```

### Package-Specific Commands
```bash
# Web app (from apps/web)
pnpm dev                    # Start dev server on port 3001
pnpm build                  # Build for production
pnpm lint:fix               # Fix ESLint issues

# Database (from packages/db)
pnpm db:push                # Push schema changes
pnpm db:studio              # Open Drizzle Studio
```

## Architecture

### Package Dependencies

The monorepo follows a strict dependency hierarchy:
- `@app-petlar/env` - Base package with no dependencies
- `@app-petlar/db` - Depends on: env
- `@app-petlar/auth` - Depends on: db, env
- `@app-petlar/api` - Depends on: auth, db, env
- `web` app - Depends on: api, auth, env

### tRPC API Layer

The API is built with tRPC and located in `packages/api/`:

- **Context** (`src/context.ts`): Creates request context with Better Auth session
- **Procedures** (`src/index.ts`):
  - `publicProcedure` - No authentication required
  - `protectedProcedure` - Requires valid session, throws UNAUTHORIZED if not authenticated
- **Routers** (`src/routers/index.ts`): Define API endpoints using procedures
- **Integration**: Web app calls tRPC via `/api/trpc/[trpc]/route.ts`

Example router pattern:
```typescript
export const appRouter = router({
  myEndpoint: publicProcedure.query(() => { ... }),
  privateEndpoint: protectedProcedure.query(({ ctx }) => {
    // ctx.session is guaranteed to exist
  }),
})
```

### Database & ORM

- **ORM**: Drizzle with LibSQL/Turso (SQLite dialect)
- **Client**: Configured in `packages/db/src/index.ts`
- **Schemas**: Located in `packages/db/src/schema/`
  - `auth.ts` - Better Auth tables (users, sessions, etc.)
  - Add new schemas as separate files, export from `index.ts`
- **Migrations**: Located in `packages/db/src/migrations/`
- **Config**: `packages/db/drizzle.config.ts` uses Turso dialect

Database workflow:
1. Define/update schema in `packages/db/src/schema/`
2. Run `pnpm db:generate --name <migration-name>` to create migrations
   - **Always use a descriptive name** that reflects what was changed (e.g., `--name add-cats-table`, `--name add-status-to-users`)
3. Run `pnpm db:push` to apply to database
4. Use `pnpm db:studio` to inspect data

### Authentication

Better Auth is configured in `packages/auth/src/index.ts`:
- Uses Drizzle adapter with SQLite provider
- Email/password authentication enabled
- Next.js cookies plugin integrated
- Session validation in tRPC context

Client-side auth (web app): `apps/web/src/lib/auth-client.ts`

### Frontend (Next.js)

- **App Router** with typed routes enabled
- **React Compiler** enabled for optimizations
- **Port**: 3001 (configured in package.json)
- **tRPC Client**: Configured in `apps/web/src/utils/trpc.ts`
- **React Query**: Integrated with tRPC for data fetching
- **Styling**: Tailwind CSS v4 with custom configuration

### Component Organization

Components follow a co-location pattern:

```
apps/web/src/
├── app/
│   ├── login/
│   │   ├── _components/       # Page-specific components
│   │   │   └── sign-in-form.tsx
│   │   └── page.tsx
│   ├── admin/
│   │   ├── _components/       # Admin-specific components
│   │   └── page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/                    # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   └── ...
│   ├── providers.tsx          # Global providers
│   └── theme-provider.tsx     # Theme configuration
└── lib/
    └── utils.ts
```

**Guidelines:**
- **`_components/`**: Page-specific components that are only used within that route. The underscore prefix prevents Next.js from treating it as a route segment.
- **`components/ui/`**: Reusable shadcn/ui base components (Button, Card, Input, etc.)
- **`components/`**: Shared components used across multiple pages (providers, layouts, etc.)

When creating new components:
1. If it's only used in one page → place in `app/[page]/_components/`
2. If it's a base UI primitive → place in `components/ui/`
3. If it's shared across pages → place in `components/`

### Server Actions

#### Organization
- Feature-specific actions → `_actions/` folder inside the page folder
- Shared/reusable actions → `/actions/` at src root
- Rule: used in 1 place = next to feature, used in 2+ places = root folder

#### Standard Structure
- File with `"use server"` directive at the top
- Validate inputs with Zod
- Standardized return type:
  ```typescript
  type ActionResponse<T> = {
    success: boolean
    data?: T
    error?: string
  }
  ```
- Always handle errors and return user-friendly messages
- Revalidate paths when needed with `revalidatePath()`

### shadcn/ui

- **Always use shadcn/ui components when available** - never create custom components if shadcn already provides one
- Use the shadcn MCP to check available components, read documentation, and install new components
- Follow shadcn documentation for proper component usage
- Customize only via Tailwind classes or extending the component

### Design System

**Documentação completa:** `/DESIGN-SYSTEM.md`

O PetLar segue um design system documentado com foco em **acolhimento e amigabilidade**.

#### Princípios
- **Acolhedor**: Bordas arredondadas, cores suaves, sensação de lar
- **Confiável**: Hierarquia clara, espaçamento generoso
- **Amigável**: Micro-interações suaves, feedback visual
- **Acessível**: Contraste WCAG AA, navegação por teclado

#### Paleta
- **Azul céu** (#AEC7E2): Fundo, acolhimento
- **Marrom terra** (#783201): Texto, legibilidade
- **Laranja vibrante** (#E35915): CTAs, energia

#### Tipografia
- **DM Sans**: Corpo de texto (font-sans)
- **Outfit**: Headlines e títulos (font-display)

#### Dois Contextos
| Site Público | Painel Admin |
|--------------|--------------|
| Emocional, ilustrativo | Funcional, clean |
| Elementos temáticos de gatos | Neutro profissional |
| Cards `rounded-2xl` | Cards `rounded-xl` |
| Animações expressivas | Transições sutis |

#### Quick Reference
```tsx
// Título de página (admin)
<h1 className="text-2xl font-bold tracking-tight"
    style={{ fontFamily: 'var(--font-display)' }}>

// Card padrão
<Card className="rounded-xl shadow-sm">

// Botão primário com efeito
<Button className="shadow-lg shadow-primary/25 hover:shadow-primary/35
                   transition-all hover:scale-[1.02] active:scale-[0.98]">

// Input com ícone
<div className="relative">
  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input className="pl-10 h-11 rounded-lg" />
</div>
```

- Mobile-first approach
- Sempre consultar `/DESIGN-SYSTEM.md` para padrões detalhados

### Environment Variables

Environment variables are validated using `@t3-oss/env-nextjs` in `packages/env/`:
- **Server-side**: Import from `@app-petlar/env/server`
- **Client-side**: Import from `@app-petlar/env/web`
- **Web config**: Must be imported in `next.config.ts`

Required environment variables:
- `DATABASE_URL` - LibSQL/Turso database URL
- `DATABASE_AUTH_TOKEN` - LibSQL/Turso auth token (optional for local)
- `CORS_ORIGIN` - Trusted origin for Better Auth

### Shared Configuration

The `packages/config/` package provides shared configs:
- **ESLint**: `eslint.base.js` - TypeScript, import ordering, no console warnings
- **Prettier**: `prettier.base.js` - Single quotes, no semicolons, 80 char width
- **TypeScript**: `tsconfig.base.json` - Strict mode, ESNext, bundler resolution

Each package extends these base configs in their local config files.

## Code Style

- **Import Organization**: Enforced by ESLint with alphabetical ordering and grouped by type
- **Type Imports**: Use inline type imports (`import { type Foo }`)
- **Unused Variables**: Prefix with underscore (`_variable`)
- **Console Usage**: Only `console.warn` and `console.error` allowed
- **Formatting**: Run `pnpm format` before committing

## Development Workflow

1. Start local database: `pnpm db:local`
2. Start dev server: `pnpm dev:web`
3. For schema changes:
   - Update schema in `packages/db/src/schema/`
   - Generate migration: `pnpm db:generate --name <descriptive-name>`
   - Apply changes: `pnpm db:push`
4. For new API endpoints:
   - Add to `packages/api/src/routers/index.ts`
   - Type safety is automatic via tRPC
5. Run linting: `pnpm lint:fix` before committing

## Package Manager

This project uses **pnpm** with catalog dependencies. The catalog is defined in `pnpm-workspace.yaml` to ensure consistent versions across packages. Always use `pnpm` commands, not `npm` or `yarn`.

## Important Notes

- Next.js config includes `serverExternalPackages: ['libsql', '@libsql/client']` to prevent bundling database client
- React Compiler is enabled - avoid manual memoization unless necessary
- All packages use ESM (`"type": "module"`)
- The web app runs on port 3001 (not the default 3000)
- Database uses Turso dialect for Drizzle, which is SQLite-compatible
