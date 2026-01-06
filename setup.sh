#!/bin/bash
# Anonymous Voting System - Setup Script

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Anonymous Voting System - Setup Assistant                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "   Download from: https://nodejs.org"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) found${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v) found${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo "   Download from: https://www.postgresql.org/download"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL found${NC}"

echo ""
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd backend
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

echo ""
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd ../frontend
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Setup Complete!                                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "1. Setup PostgreSQL database:"
echo "   createdb anonymous_voting_db"
echo "   createuser -P voting_user"
echo "   psql -d anonymous_voting_db"
echo "   GRANT ALL PRIVILEGES ON DATABASE anonymous_voting_db TO voting_user;"
echo "   GRANT ALL ON SCHEMA public TO voting_user;"
echo ""
echo "2. Start backend (in another terminal):"
echo "   cd backend && npm run dev"
echo ""
echo "3. Start frontend (in another terminal):"
echo "   cd frontend && npm run dev"
echo ""
echo "4. Open browser to: http://localhost:5173"
echo ""
echo "For detailed instructions, see: QUICKSTART.md"
