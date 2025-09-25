# Otsukai DX

Voice-enabled shopping service platform that connects users who need items purchased with shoppers who can fulfill those requests.

## Architecture

This is a monorepo containing:

- **apps/user-web** - User-facing Next.js application (port 3000)
- **apps/shopper-web** - Shopper Next.js application (port 3001)  
- **apps/admin-web** - Admin Next.js application (port 3002)
- **services/api** - NestJS backend API (port 4000)
- **packages/ui** - Shared UI components with Tailwind CSS
- **packages/types** - Shared TypeScript types

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: NestJS, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with refresh tokens
- **Payments**: Stripe Payment Intents
- **Storage**: S3-compatible storage
- **Monorepo**: pnpm workspaces + Turborepo

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
│   ├── user-web/          # User application
│   ├── shopper-web/       # Shopper application
│   └── admin-web/         # Admin application
├── services/
│   └── api/               # Backend API
├── packages/
│   ├── ui/                # Shared components
│   └── types/             # Shared types
├── tests/
│   └── e2e/               # End-to-end tests
└── docs/                  # Documentation
```

## Features

- 🎤 Voice-to-shopping list conversion using GPT-4o mini
- 📱 Mobile-first responsive design
- 💳 Secure payment processing with Stripe
- 📸 Receipt verification system
- 💬 Real-time chat between users and shoppers
- 🔐 KYC verification for shoppers
- 📊 Admin dashboard for platform management
- 🔔 Push notifications for order updates
- 🤖 Advanced AI-powered natural language processing
- 🎯 High-accuracy Japanese voice transcription with Whisper

## License

Private - All rights reserved