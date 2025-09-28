# Otsy Setup Guide

## Prerequisites

- Node.js 18+
- pnpm 8+
- Docker and Docker Compose
- PostgreSQL (via Docker)

## Quick Start

1. **Clone and install dependencies**
   ```bash
   git clone <repository>
   cd otsukai-dx
   pnpm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start local services**
   ```bash
   docker compose up -d
   ```

4. **Set up database**
   ```bash
   cd services/api
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```

5. **Start development servers**
   ```bash
   cd ../..
   pnpm dev
   ```

## Services

- **User Web App**: http://localhost:3000
- **Shopper Web App**: http://localhost:3001
- **Admin Web App**: http://localhost:3002
- **API Server**: http://localhost:4000/v1
- **PostgreSQL**: localhost:5432
- **MinIO Console**: http://localhost:9001

## Test Accounts

After running `pnpm db:seed`, you'll have these test accounts:

- **Admin**: admin@otsy.local / admin123
- **User**: user@otsy.local / user123
- **Shopper**: shopper@otsy.local / shopper123

## Development Commands

```bash
# Start all services
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Database operations
cd services/api
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema changes
pnpm db:migrate     # Create migration
pnpm db:seed        # Seed test data
pnpm db:reset       # Reset database
```

## Authentication

The system uses JWT-based authentication with role-based access control:

- **Users**: End customers who place orders
- **Shoppers**: Service providers who fulfill orders
- **Admins**: Platform operators with management access

### API Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer <access_token>
```

### Token Refresh

Access tokens expire in 15 minutes. Use refresh token to get new access token:
```bash
POST /v1/auth/refresh
{
  "refresh_token": "<refresh_token>"
}
```

## Environment Variables

Key environment variables to configure:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/otsukai"

# JWT Secrets (change in production)
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"

# Stripe (get from Stripe dashboard)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# S3 Storage (MinIO for local development)
S3_ENDPOINT="http://localhost:9000"
S3_BUCKET="otsukai-dev"
S3_ACCESS_KEY="minio"
S3_SECRET_KEY="minio123"

# LLM Service
OPENAI_API_KEY="your-openai-api-key"
```

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker compose ps

# Restart database
docker compose restart db

# Check logs
docker compose logs db
```

### Port Conflicts
If ports are already in use, update the ports in:
- `docker-compose.yml` (database and MinIO)
- `package.json` scripts (web apps)
- `.env.local` (API configuration)

### Prisma Issues
```bash
# Regenerate Prisma client
cd services/api
pnpm db:generate

# Reset database if schema changes
pnpm db:reset
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure production database
4. Set up proper CORS origins
5. Use production Stripe keys
6. Configure S3 with proper access controls