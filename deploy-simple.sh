#!/bin/bash
set -e

echo "🚀 UIT Canteen Payment System - Simple Deployment"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd "$(dirname "$0")"

# Step 1: Check Vercel CLI
echo -e "${YELLOW}Step 1: Checking Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi
echo -e "${GREEN}✓ Vercel CLI ready${NC}"

# Step 2: Check if logged in
echo ""
echo -e "${YELLOW}Step 2: Checking Vercel authentication...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Please login to Vercel:${NC}"
    vercel login
fi
echo -e "${GREEN}✓ Authenticated as: $(vercel whoami)${NC}"

# Step 3: Get database URL
echo ""
echo -e "${YELLOW}Step 3: Database Setup${NC}"
echo "You need a PostgreSQL database. Options:"
echo "  1. Neon (free): https://console.neon.tech"
echo "  2. Supabase (free): https://supabase.com"
echo "  3. Vercel Postgres: https://vercel.com/marketplace"
echo ""
echo "Create a project and copy the PostgreSQL connection string."
echo "It should look like: postgresql://user:pass@host:5432/db?sslmode=require"
echo ""

read -p "Enter your DATABASE_URL: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL is required${NC}"
    exit 1
fi

# Step 4: Generate JWT secret
echo ""
echo -e "${YELLOW}Step 4: Generating JWT_SECRET...${NC}"
JWT_SECRET=$(head -c 48 /dev/urandom | base64 | tr -d '=+/')
echo -e "${GREEN}✓ JWT_SECRET generated${NC}"

# Step 5: Deploy to Vercel
echo ""
echo -e "${YELLOW}Step 5: Deploying to Vercel...${NC}"
echo "This will create a new Vercel project or use existing one."
echo ""

# First deployment to create project
echo "Running initial deployment..."
vercel --yes

# Set environment variables
echo ""
echo "Setting environment variables..."
echo "$DATABASE_URL" | vercel env add DATABASE_URL production --yes 2>/dev/null || echo "DATABASE_URL already set or run: vercel env add DATABASE_URL"
echo "$JWT_SECRET" | vercel env add JWT_SECRET production --yes 2>/dev/null || echo "JWT_SECRET already set or run: vercel env add JWT_SECRET"

# Production deployment
echo ""
echo "Deploying to production..."
DEPLOY_OUTPUT=$(vercel --prod --yes 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract URL
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^[:space:]]*\.vercel\.app' | tail -1)

if [ -z "$DEPLOY_URL" ]; then
    DEPLOY_URL=$(vercel ls 2>/dev/null | grep -o 'https://[^[:space:]]*\.vercel\.app' | head -1)
fi

# Step 6: Run migrations
echo ""
echo -e "${YELLOW}Step 6: Running database migrations...${NC}"
echo "Creating temporary .env file..."
echo "DATABASE_URL=$DATABASE_URL" > .env.production.local
export DATABASE_URL

echo "Running migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npm run prisma:seed

rm -f .env.production.local

echo -e "${GREEN}✓ Database ready${NC}"

# Final output
echo ""
echo "=================================================="
echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
echo "=================================================="
echo ""
echo -e "${GREEN}Your website is live at:${NC}"
if [ -n "$DEPLOY_URL" ]; then
    echo "  $DEPLOY_URL"
else
    echo "  Run 'vercel ls' to see your deployment URL"
fi
echo ""
echo "Default login credentials:"
echo "  Admin:    username=admin     password=admin123"
echo "  Store:    username=store1    password=store123"  
echo "  Student:  username=student1  password=user123"
echo ""
echo -e "${YELLOW}Admin Dashboard:${NC}"
if [ -n "$DEPLOY_URL" ]; then
    echo "  $DEPLOY_URL/admin"
fi
echo ""
