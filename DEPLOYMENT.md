# Deployment Guide - UIT Canteen Payment System

## Overview

This project has been migrated from SQLite to PostgreSQL and configured for deployment on Vercel.

## Changes Made

### 1. Database Migration (SQLite → PostgreSQL)

- **Prisma Schema**: Updated `provider` from `"sqlite"` to `"postgresql"`
- **Dependencies**: Added `pg` package for PostgreSQL connectivity
- **Migration**: Created new PostgreSQL-compatible migration at `prisma/migrations/20260404000000_init/`
- **Environment Variables**: Updated `.env.example` with PostgreSQL connection string format

### 2. Vercel Configuration

- **next.config.ts**: Configured for standalone output with experimental server components support
- **vercel.json**: Build commands and environment variable definitions
- **package.json**: Added `vercel-build` script and `postinstall` hook

## Deployment Steps

### Prerequisites

1. Vercel account (https://vercel.com)
2. PostgreSQL database (options below)

### Option A: Vercel Postgres (Recommended)

1. Install Vercel Postgres from the Vercel Marketplace
2. The `DATABASE_URL` will be automatically configured

### Option B: External PostgreSQL (Neon, Supabase, AWS RDS, etc.)

1. Create a PostgreSQL database with your provider
2. Copy the connection string

### Deploy to Vercel

#### Method 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Method 2: Git Integration (Recommended)

1. Push code to GitHub/GitLab/Bitbucket
2. Import project in Vercel dashboard
3. Configure environment variables (see below)
4. Deploy

### Environment Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `JWT_SECRET` | Secret for JWT signing (min 32 chars) | `your-super-secret-key-here-32chars` |
| `NEXT_PUBLIC_API_BASE_URL` | API base URL (optional) | `https://your-app.vercel.app` |

### Database Setup

After first deployment, run migrations and seed:

```bash
# Run migrations
npx prisma migrate deploy

# Seed database (optional - creates default users)
npm run prisma:seed
```

Or use Vercel CLI for one-off commands:

```bash
vercel env pull  # Pull env variables
npx prisma migrate deploy
npm run prisma:seed
```

## Default Login Credentials (After Seeding)

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Store | `store1` | `store123` |
| Student | `student1` | `user123` |
| Student | `student2` | `user123` |
| Student | `student3` | `user123` |

## Local Development

### Setup Local PostgreSQL

```bash
# Create local database (using Docker)
docker run -d \
  --name canteen-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=canteen_db \
  -p 5432:5432 \
  postgres:15

# Set environment variable
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/canteen_db"
```

### Run Development Server

```bash
# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npm run prisma:seed

# Start dev server
npm run dev
```

## Troubleshooting

### Build Failures

1. **Prisma generate fails**: Ensure `postinstall` script runs automatically
2. **Migration fails**: Check `DATABASE_URL` is correctly set
3. **Module not found**: Run `npm install` and `npx prisma generate`

### Database Connection Issues

1. Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database?sslmode=require`
2. Ensure SSL is enabled for external databases
3. Check firewall rules allow connections from Vercel

### Runtime Errors

1. **JWT errors**: Ensure `JWT_SECRET` is at least 32 characters
2. **Database timeouts**: Consider connection pooling for high traffic

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Client    │──────▶   Vercel    │──────▶  PostgreSQL │
│  (Browser)  │      │  (Next.js)  │      │   Database  │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │    Prisma   │
                     │    ORM      │
                     └─────────────┘
```

## Post-Deployment Checklist

- [ ] Application loads without errors
- [ ] Admin login works
- [ ] Store POS functions work
- [ ] Student wallet features work
- [ ] Database persists data correctly
- [ ] Run load test if needed

## Support

For issues or questions, check:
- Vercel Docs: https://vercel.com/docs
- Prisma Docs: https://prisma.io/docs
- Next.js Docs: https://nextjs.org/docs
