#!/bin/bash

# Script tự động reset mạng Besu và setup admin account trong genesis.json
# Usage: ./reset-and-setup-admin.sh
# 
# WARNING: Script này sẽ XÓA TẤT CẢ dữ liệu blockchain hiện tại!
# Chỉ chạy ở giai đoạn đầu của dự án (Phase 1 → Phase 2)

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_DIR="$NETWORK_DIR/config"
GENESIS_FILE="$CONFIG_DIR/genesis.json"

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}Reset Besu Network & Setup Admin Account${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# Warning
echo -e "${RED}⚠️  CẢNH BÁO: Script này sẽ XÓA TẤT CẢ dữ liệu blockchain!${NC}"
echo -e "${YELLOW}Chỉ chạy ở giai đoạn đầu của dự án (Phase 1 → Phase 2)${NC}"
echo ""
read -p "Bạn có chắc chắn muốn tiếp tục? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Đã hủy."
    exit 0
fi

echo ""
echo -e "${YELLOW}1. Dừng mạng Besu...${NC}"
cd "$NETWORK_DIR"
docker-compose down || true
echo -e "${GREEN}✓ Mạng đã dừng${NC}"
echo ""

echo -e "${YELLOW}2. Xóa dữ liệu blockchain...${NC}"
if [ -d "$NETWORK_DIR/data" ]; then
    rm -rf "$NETWORK_DIR/data/validator1" \
           "$NETWORK_DIR/data/validator2" \
           "$NETWORK_DIR/data/validator3" \
           "$NETWORK_DIR/data/rpc-node"
    echo -e "${GREEN}✓ Đã xóa dữ liệu blockchain${NC}"
else
    echo -e "${YELLOW}⚠ Không tìm thấy thư mục data, bỏ qua${NC}"
fi
echo ""

echo -e "${YELLOW}3. Tạo admin account...${NC}"
if [ -f "$SCRIPT_DIR/create-admin-account.sh" ]; then
    bash "$SCRIPT_DIR/create-admin-account.sh"
    echo -e "${GREEN}✓ Admin account đã được tạo${NC}"
else
    echo -e "${RED}✗ Không tìm thấy script create-admin-account.sh${NC}"
    exit 1
fi
echo ""

# Read admin address from .env or admin-account.json
ADMIN_ADDRESS=""
if [ -f "$NETWORK_DIR/.env" ]; then
    ADMIN_ADDRESS=$(grep "^ADMIN_ADDRESS=" "$NETWORK_DIR/.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
fi

if [ -z "$ADMIN_ADDRESS" ] && [ -f "$CONFIG_DIR/admin-account.json" ]; then
    ADMIN_ADDRESS=$(grep -o '"address":"[^"]*"' "$CONFIG_DIR/admin-account.json" | cut -d'"' -f4)
fi

if [ -z "$ADMIN_ADDRESS" ]; then
    echo -e "${RED}✗ Không tìm thấy admin address. Vui lòng chạy create-admin-account.sh trước.${NC}"
    exit 1
fi

echo -e "${GREEN}Admin Address: $ADMIN_ADDRESS${NC}"
echo ""

echo -e "${YELLOW}4. Thêm admin account vào genesis.json...${NC}"

# Check if admin address already exists in genesis.json
if grep -q "\"$ADMIN_ADDRESS\"" "$GENESIS_FILE"; then
    echo -e "${YELLOW}⚠ Admin address đã tồn tại trong genesis.json${NC}"
else
    # Backup genesis.json
    cp "$GENESIS_FILE" "$GENESIS_FILE.backup"
    
    # Use Python to add admin address to genesis.json (more reliable than sed)
    python3 << EOF
import json
import sys

genesis_file = "$GENESIS_FILE"
admin_address = "$ADMIN_ADDRESS"
balance = "0x200000000000000000000000000000000000000000000000000000000000000"

try:
    with open(genesis_file, 'r') as f:
        genesis = json.load(f)
    
    # Add admin account to alloc section
    if 'alloc' not in genesis:
        genesis['alloc'] = {}
    
    genesis['alloc'][admin_address.lower()] = {
        "balance": balance
    }
    
    with open(genesis_file, 'w') as f:
        json.dump(genesis, f, indent=2)
    
    print(f"✓ Đã thêm admin address vào genesis.json")
    sys.exit(0)
except Exception as e:
    print(f"✗ Lỗi khi cập nhật genesis.json: {e}")
    sys.exit(1)
EOF
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Lỗi khi cập nhật genesis.json. Đang khôi phục backup...${NC}"
        mv "$GENESIS_FILE.backup" "$GENESIS_FILE"
        exit 1
    fi
    
    rm -f "$GENESIS_FILE.backup"
fi
echo ""

echo -e "${YELLOW}5. Khởi động lại mạng Besu...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ Mạng đã khởi động${NC}"
echo ""

echo -e "${YELLOW}6. Đợi mạng khởi tạo (30 giây)...${NC}"
sleep 30
echo ""

echo -e "${YELLOW}7. Kiểm tra trạng thái mạng...${NC}"
if [ -f "$SCRIPT_DIR/check-network.sh" ]; then
    bash "$SCRIPT_DIR/check-network.sh"
else
    echo -e "${YELLOW}⚠ Script check-network.sh không tồn tại, bỏ qua${NC}"
fi
echo ""

echo -e "${BLUE}==========================================${NC}"
echo -e "${GREEN}✓ Hoàn thành!${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""
echo "Admin Account Information:"
echo "  Address: $ADMIN_ADDRESS"
echo "  Private Key: (Xem trong $NETWORK_DIR/.env)"
echo ""
echo "Genesis file đã được cập nhật với admin account."
echo "Admin account đã được fund trong genesis.json."
echo ""
echo "Bạn có thể bắt đầu Phase 2 (Deploy Smart Contracts) ngay bây giờ!"
