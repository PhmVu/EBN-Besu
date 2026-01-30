#!/bin/bash

# Setup and Deploy Script for Smart Contracts
# This script automates the entire setup and deployment process

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACTS_DIR="$(dirname "$SCRIPT_DIR")"
cd "$CONTRACTS_DIR"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "=========================================="
echo -e "${BLUE}Smart Contracts Setup and Deployment${NC}"
echo "=========================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Check Prerequisites
echo -e "${BLUE}Step 1: Checking Prerequisites...${NC}"
echo "-----------------------------------"

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"

# Check npm
if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"

# Check .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}   Copying .env.example to .env...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}   Please edit .env with your configuration${NC}"
        exit 1
    else
        echo -e "${RED}❌ .env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Check if required env vars are set
source .env 2>/dev/null || true
if [ -z "$RPC_URL" ] || [ -z "$ADMIN_PRIVATE_KEY" ]; then
    echo -e "${RED}❌ Required environment variables not set in .env${NC}"
    echo -e "${RED}   Please set RPC_URL and ADMIN_PRIVATE_KEY${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

# Step 2: Install Dependencies
echo -e "${BLUE}Step 2: Installing Dependencies...${NC}"
echo "-----------------------------------"
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi
echo ""

# Step 3: Compile Contracts
echo -e "${BLUE}Step 3: Compiling Contracts...${NC}"
echo "-----------------------------------"
if npm run compile; then
    echo -e "${GREEN}✅ Contracts compiled successfully${NC}"
else
    echo -e "${RED}❌ Compilation failed${NC}"
    exit 1
fi
echo ""

# Step 4: Run Tests
echo -e "${BLUE}Step 4: Running Tests...${NC}"
echo "-----------------------------------"
read -p "Do you want to run tests? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if npm test; then
        echo -e "${GREEN}✅ All tests passed${NC}"
    else
        echo -e "${RED}❌ Tests failed${NC}"
        read -p "Continue with deployment anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Skipping tests${NC}"
fi
echo ""

# Step 5: Deploy to Besu Network
echo -e "${BLUE}Step 5: Deploying to Besu Network...${NC}"
echo "-----------------------------------"
read -p "Do you want to deploy contracts? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Deploying contracts..."
    if npm run deploy:besu; then
        echo -e "${GREEN}✅ Contracts deployed successfully${NC}"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Skipping deployment${NC}"
fi
echo ""

# Step 6: Extract ABI and Addresses
echo -e "${BLUE}Step 6: Extracting ABI and Addresses...${NC}"
echo "-----------------------------------"
if [ -f "deployments/latest.json" ]; then
    if node scripts/extract-abi.js; then
        echo -e "${GREEN}✅ ABI and addresses extracted${NC}"
        echo -e "${GREEN}   Output: contracts.json${NC}"
    else
        echo -e "${YELLOW}⚠️  ABI extraction failed (contracts may not be deployed)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No deployment found. Skipping ABI extraction${NC}"
fi
echo ""

# Step 7: Summary
echo "=========================================="
echo -e "${BLUE}Setup and Deployment Summary${NC}"
echo "=========================================="
echo ""

if [ -f "deployments/latest.json" ]; then
    echo -e "${GREEN}✅ Deployment completed!${NC}"
    echo ""
    echo "Contract addresses:"
    node -e "
        const fs = require('fs');
        const deployment = JSON.parse(fs.readFileSync('deployments/latest.json', 'utf8'));
        console.log('  ClassManager:', deployment.contracts.ClassManager.address);
        console.log('  ScoreManager:', deployment.contracts.ScoreManager.address);
    "
    echo ""
    if [ -f "contracts.json" ]; then
        echo -e "${GREEN}✅ contracts.json created for backend integration${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No deployment found${NC}"
fi

echo ""
echo "Next steps:"
echo "1. Use contracts.json in your backend"
echo "2. Update backend .env with contract addresses"
echo "3. Start Phase 3: Backend API development"
echo ""
