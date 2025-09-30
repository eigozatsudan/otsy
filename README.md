# Otsukai DX Pivot

Privacy-first household and friend group collaborative shopping management application. Groups of family members or friends can collectively manage shopping lists, coordinate purchases, and fairly split costs with minimal personal information collection.

## Architecture

This is a monorepo containing:

- **apps/web** - Single Next.js PWA application (port 3000)
- **services/api** - NestJS backend API (port 4000)
- **packages/ui** - Shared UI components with golden ratio design system
- **packages/types** - Shared TypeScript types

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS (PWA enabled)
- **Backend**: NestJS, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with refresh tokens (email + display name only)
- **Storage**: S3-compatible storage (receipt images only)
- **Real-time**: Server-Sent Events (SSE)
- **Revenue**: Non-intrusive advertising
- **Monorepo**: Yarn workspaces + Turborepo

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or pnpm 8+ if preferred)
- PostgreSQL
- Docker (for local development)

### Installation

```bash
# Install dependencies for all packages
npm install

# Set up environment variables
cp .env.example .env.local

# Start local services (PostgreSQL + MinIO)
docker compose up -d

# Generate Prisma client and run migrations
cd services/api
npm run db:generate
npm run db:push
npm run db:seed

# Start development servers
cd ../..
npm run dev
```

### Troubleshooting

If you encounter TypeScript errors about missing modules like `class-validator`:

1. Make sure all dependencies are installed:
```bash
npm install
```

2. If using pnpm, install dependencies:
```bash
pnpm install
```

3. Generate Prisma client:
```bash
cd services/api
npm run db:generate
# or with pnpm
pnpm db:generate
```

4. Restart your TypeScript language server in your IDE

```bash
# Clean install all dependencies
rm -rf node_modules */node_modules */*/node_modules
npm install

# Generate Prisma client
cd services/api
npm run db:generate
```

### Development

```bash
# Run all apps in development mode
npm run dev

# Build all packages
npm run build

# Run linting
npm run lint

# Run type checking
npm run type-check

# Generate API types from OpenAPI spec
npm run codegen:types

# Database operations
cd services/api
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Create and run migrations
npm run db:seed        # Seed database with test data
npm run db:reset       # Reset database (development only)
```

## Project Structure

```
otsukai-dx/
├── apps/
│   └── web/               # Single PWA application
├── services/
│   └── api/               # Backend API
├── packages/
│   ├── ui/                # Shared components with golden ratio design
│   └── types/             # Shared types
└── tests/
    └── e2e/               # End-to-end tests
```

## Features

- 👥 Group creation and management with invite codes
- 🛒 Collaborative shopping lists with real-time updates
- 💰 Sophisticated cost splitting (equal/quantity/custom)
- 💬 Group chat with item-specific threaded discussions
- 📸 Receipt image upload with PII warnings
- 🔒 Privacy-first design (email + display name only)
- 📱 Mobile-optimized with golden ratio design principles
- 📊 Non-intrusive advertising revenue model
- ♿ WCAG AA accessibility compliance
- 🔔 Push notifications for group activities

## License

Private - All rights reserved