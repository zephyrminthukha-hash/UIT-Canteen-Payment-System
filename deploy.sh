#!/bin/bash
set -e

echo "🚀 UIT Canteen Payment System - Automated Deployment"
echo "======================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check requirements
echo -e "${YELLOW}Step 1: Checking requirements...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ required. Current: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Step 2: Install Vercel CLI if needed
echo ""
echo -e "${YELLOW}Step 2: Setting up Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi
echo -e "${GREEN}✓ Vercel CLI ready${NC}"

# Step 3: Check GitHub CLI
echo ""
echo -e "${YELLOW}Step 3: Checking GitHub CLI...${NC}"
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠ GitHub CLI not found. Installing...${NC}"
    # Try to install gh based on OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
        sudo apt update && sudo apt install gh -y
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install gh
    else
        echo -e "${RED}Please install GitHub CLI manually: https://cli.github.com${NC}"
        exit 1
    fi
fi

# Check if authenticated
echo "Checking GitHub authentication..."
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}Please login to GitHub:${NC}"
    gh auth login --web
fi
echo -e "${GREEN}✓ GitHub CLI authenticated${NC}"

# Step 4: Create GitHub repository
echo ""
echo -e "${YELLOW}Step 4: Creating GitHub repository...${NC}"
REPO_NAME="uit-canteen-payment-system"
if gh repo view "$REPO_NAME" &> /dev/null; then
    echo -e "${YELLOW}Repository already exists. Using existing repo.${NC}"
else
    echo "Creating new repository: $REPO_NAME"
    gh repo create "$REPO_NAME" --public --source=. --push
fi
echo -e "${GREEN}✓ GitHub repository ready${NC}"

# Step 5: Set up Neon PostgreSQL database
echo ""
echo -e "${YELLOW}Step 5: Setting up Neon PostgreSQL database...${NC}"
echo "This will create a free Neon PostgreSQL database."
echo "Please sign up/login at neon.tech when prompted."
echo ""

# Check if Neon CLI is installed
if ! command -v neonctl &> /dev/null; then
    echo "Installing Neon CLI..."
    npm install -g neonctl
fi

# Check if authenticated with Neon
if ! neonctl auth status &> /dev/null 2>&1; then
    echo -e "${YELLOW}Please authenticate with Neon:${NC}"
    neonctl auth login
fi

# Create project and get connection string
echo "Creating Neon project..."
PROJECT_INFO=$(neonctl projects create --name "uit-canteen-db" --region "aws-southeast-1" --output json 2>/dev/null || true)

if [ -z "$PROJECT_INFO" ]; then
    echo -e "${YELLOW}Project may already exist. Getting connection string...${NC}"
    # Get the connection string from existing project
    DB_URL=$(neonctl connection-string --project-name "uit-canteen-db" --role-name "neondb_owner" --database-name "neondb" --output text 2>/dev/null || echo "")
else
    DB_URL=$(echo "$PROJECT_INFO" | neonctl connection-string --output text 2>/dev/null || echo "")
fi

if [ -z "$DB_URL" ]; then
    echo -e "${YELLOW}Could not auto-create database. Please manually:${NC}"
    echo "1. Go to https://console.neon.tech"
    echo "2. Create a new project"
    echo "3. Copy the connection string"
    echo ""
    read -p "Paste your DATABASE_URL here: " DB_URL
fi

echo -e "${GREEN}✓ Database ready${NC}"

# Step 6: Deploy to Vercel
echo ""
echo -e "${YELLOW}Step 6: Deploying to Vercel...${NC}"

# Check if authenticated with Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Please login to Vercel:${NC}"
    vercel login
fi

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 48 2>/dev/null || head -c 48 /dev/urandom | base64)

# Link and deploy
echo "Linking to Vercel project..."
vercel link --yes --project "$REPO_NAME" 2>/dev/null || vercel --yes

echo "Adding environment variables..."
echo "$DB_URL" | vercel env add DATABASE_URL production --yes
echo "$JWT_SECRET" | vercel env add JWT_SECRET production --yes

echo "Deploying to production..."
DEPLOYMENT_URL=$(vercel --prod --yes | grep -o 'https://[^[:space:]]*' | tail -1)

echo -e "${GREEN}✓ Deployment complete!${NC}"

# Step 7: Run migrations
echo ""
echo -e "${YELLOW}Step 7: Running database migrations...${NC}"
echo "DATABASE_URL=$DB_URL" > .env.production
echo "Running migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npm run prisma:seed

rm -f .env.production

echo -e "${GREEN}✓ Database migrated and seeded${NC}"

# Final output
echo ""
echo "======================================================"
echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
echo "======================================================"
echo ""
echo -e "${GREEN}Your website is live at:${NC}"
echo -e "  $DEPLOYMENT_URL"
echo ""
echo "Default login credentials:"
echo "  Admin:    username=admin     password=admin123"
echo "  Store:    username=store1    password=store123"
echo "  Student:  username=student1  password=user123"
echo ""
echo "Environment variables set:"
echo "  DATABASE_URL: [configured]"
echo "  JWT_SECRET:   [configured]"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  - Visit your admin dashboard at: $DEPLOYMENT_URL/admin"
echo "  - Log in with admin/admin123"
echo ""
