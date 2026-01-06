#!/bin/bash

# ============================================
# 🗄️  Database Setup Script
# ============================================
# สร้าง database, user, tables ทั้งหมดอัตโนมัติ
# Usage: bash setup-database.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Configuration
# ============================================
DB_NAME="anonymous_voting_db"
DB_USER="voting_user"
DB_PASSWORD="votingpass123"
DB_HOST="localhost"
DB_PORT="5432"
POSTGRES_USER="postgres"

# ============================================
# Functions
# ============================================

print_header() {
  echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC}  🗄️  Anonymous Voting System - Database Setup${NC}               ${BLUE}║${NC}"
  echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}\n"
}

print_step() {
  echo -e "\n${YELLOW}▶${NC} $1"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

check_postgres() {
  print_step "ตรวจสอบ PostgreSQL..."
  
  if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL ไม่ได้ติดตั้ง"
    echo "ติดตั้ง: brew install postgresql"
    exit 1
  fi
  
  print_success "PostgreSQL พร้อม"
}

check_database_exists() {
  print_step "ตรวจสอบ database ว่าเคยสร้างไหม..."
  
  if psql -U "$POSTGRES_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    print_error "Database '$DB_NAME' มีอยู่แล้ว"
    read -p "ลบและสร้างใหม่? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      print_step "ลบ database เดิม..."
      dropdb -U "$POSTGRES_USER" "$DB_NAME" 2>/dev/null || true
      print_success "ลบแล้ว"
    else
      echo "ยกเลิก"
      exit 0
    fi
  else
    print_success "Database ยังไม่มี - สร้างได้"
  fi
}

create_database() {
  print_step "สร้าง database '$DB_NAME'..."
  createdb -U "$POSTGRES_USER" "$DB_NAME"
  print_success "Database สร้างแล้ว"
}

create_user() {
  print_step "ตรวจสอบ user '$DB_USER'..."
  
  if psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_user WHERE usename = '$DB_USER'" | grep -q 1; then
    print_success "User '$DB_USER' มีอยู่แล้ว"
    
    # Update password
    print_step "อัปเดต password..."
    psql -U "$POSTGRES_USER" -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" > /dev/null
    print_success "Password อัปเดต"
  else
    print_step "สร้าง user '$DB_USER'..."
    psql -U "$POSTGRES_USER" -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" > /dev/null
    print_success "User สร้างแล้ว"
  fi
}

grant_privileges() {
  print_step "ให้สิทธิ์ให้ user '$DB_USER'..."
  psql -U "$POSTGRES_USER" -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" > /dev/null
  print_success "สิทธิ์ให้เรียบร้อย"
}

run_sql_script() {
  print_step "สร้าง tables จาก init.sql..."
  
  if [ ! -f "database/init.sql" ]; then
    print_error "ไม่พบไฟล์ database/init.sql"
    exit 1
  fi
  
  psql -U "$DB_USER" -d "$DB_NAME" -f database/init.sql > /dev/null 2>&1
  print_success "Tables สร้างแล้ว"
}

verify_setup() {
  print_step "ตรวจสอบการตั้งค่า..."
  
  TABLES=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")
  
  if [ "$TABLES" -gt 0 ]; then
    print_success "พบ $TABLES tables"
    
    # List tables
    echo -e "\n${BLUE}Tables ที่สร้าง:${NC}"
    psql -U "$DB_USER" -d "$DB_NAME" -c "\dt"
  else
    print_error "ไม่พบ tables"
    exit 1
  fi
}

show_connection_info() {
  print_step "ข้อมูล Connection"
  
  echo -e "\n${BLUE}Database Info:${NC}"
  echo "  Host:     $DB_HOST"
  echo "  Port:     $DB_PORT"
  echo "  Database: $DB_NAME"
  echo "  User:     $DB_USER"
  echo "  Password: $DB_PASSWORD"
  
  echo -e "\n${BLUE}Connection String:${NC}"
  echo "  postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
}

show_next_steps() {
  echo -e "\n${BLUE}▶ ขั้นตอนต่อไป:${NC}"
  echo "  1. Backend:"
  echo "     cd backend"
  echo "     npm install (ถ้ายังไม่ติดตั้ง)"
  echo "     npm run dev"
  echo ""
  echo "  2. Frontend:"
  echo "     cd frontend"
  echo "     npm install (ถ้ายังไม่ติดตั้ง)"
  echo "     npm run dev"
  echo ""
  echo "  3. เปิด browser:"
  echo "     http://localhost:5173"
  echo ""
  echo "  4. ดู guide:"
  echo "     QUICK_ANSWER.md"
  echo "     COMPLETE_GUIDE.md"
}

# ============================================
# Main Execution
# ============================================

print_header

# Check if running from correct directory
if [ ! -f "database/init.sql" ]; then
  print_error "ต้องรัน script จาก root directory"
  echo "Usage: cd AnonymousPersonal && bash setup-database.sh"
  exit 1
fi

# Run setup steps
check_postgres
check_database_exists
create_database
create_user
grant_privileges
run_sql_script
verify_setup
show_connection_info
show_next_steps

echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}  ✓ Database setup สำเร็จ!                                   ${GREEN}║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}\n"

exit 0
