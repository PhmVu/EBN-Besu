#!/bin/bash

# Script tạo admin account cho giáo viên
# Usage: ./create-admin-account.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_DIR="$NETWORK_DIR/config"

echo "=========================================="
echo "Creating Admin Account for Teacher"
echo "=========================================="
echo ""

# Check if Node.js is available (for ethers.js)
if command -v node &> /dev/null; then
    echo "Using Node.js to generate wallet..."
    
    # Create temporary script to generate wallet
    cat > /tmp/generate_wallet.js << 'EOF'
const { ethers } = require('ethers');

async function generateWallet() {
    const wallet = ethers.Wallet.createRandom();
    console.log(JSON.stringify({
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic ? wallet.mnemonic.phrase : null
    }, null, 2));
}

generateWallet().catch(console.error);
EOF

    # Check if ethers is installed
    if ! node -e "require('ethers')" 2>/dev/null; then
        echo "Installing ethers package..."
        npm install ethers --no-save --prefix /tmp > /dev/null 2>&1
    fi
    
    WALLET_INFO=$(node /tmp/generate_wallet.js)
    ADDRESS=$(echo "$WALLET_INFO" | grep -o '"address":"[^"]*"' | cut -d'"' -f4)
    PRIVATE_KEY=$(echo "$WALLET_INFO" | grep -o '"privateKey":"[^"]*"' | cut -d'"' -f4)
    
    rm -f /tmp/generate_wallet.js
    
elif command -v python3 &> /dev/null; then
    echo "Using Python to generate wallet..."
    
    # Create temporary script to generate wallet
    cat > /tmp/generate_wallet.py << 'EOF'
import secrets
import json
from eth_account import Account

# Generate random private key
private_key = "0x" + secrets.token_hex(32)
account = Account.from_key(private_key)

wallet_info = {
    "address": account.address,
    "privateKey": private_key
}

print(json.dumps(wallet_info, indent=2))
EOF

    # Check if eth_account is installed
    if ! python3 -c "import eth_account" 2>/dev/null; then
        echo "Installing eth-account package..."
        pip3 install eth-account --quiet --user
    fi
    
    WALLET_INFO=$(python3 /tmp/generate_wallet.py)
    ADDRESS=$(echo "$WALLET_INFO" | grep -o '"address": "[^"]*"' | cut -d'"' -f4)
    PRIVATE_KEY=$(echo "$WALLET_INFO" | grep -o '"privateKey": "[^"]*"' | cut -d'"' -f4)
    
    rm -f /tmp/generate_wallet.py
    
else
    echo "Error: Neither Node.js nor Python3 found. Please install one of them."
    exit 1
fi

if [ -z "$ADDRESS" ] || [ -z "$PRIVATE_KEY" ]; then
    echo "Error: Failed to generate wallet"
    exit 1
fi

echo "Wallet generated successfully!"
echo ""
echo "Address: $ADDRESS"
echo "Private Key: $PRIVATE_KEY"
echo ""

# Create admin-account.json (public info only)
ADMIN_ACCOUNT_FILE="$CONFIG_DIR/admin-account.json"
cat > "$ADMIN_ACCOUNT_FILE" << EOF
{
  "address": "$ADDRESS",
  "note": "This is the admin account for teacher. Private key should be stored securely in .env file, not in this file."
}
EOF

echo "Created $ADMIN_ACCOUNT_FILE (public info only)"
echo ""

# Create .env.example if it doesn't exist
ENV_EXAMPLE="$NETWORK_DIR/.env.example"
if [ ! -f "$ENV_EXAMPLE" ]; then
    cat > "$ENV_EXAMPLE" << EOF
# Admin Account Configuration
# DO NOT commit the actual private key to git!
# Copy this file to .env and fill in the actual values

ADMIN_ADDRESS=$ADDRESS
ADMIN_PRIVATE_KEY=your_admin_private_key_here

# Besu Network Configuration
RPC_URL=http://localhost:8549
RPC_WS_URL=ws://localhost:8550
CHAIN_ID=1337
EOF
    echo "Created $ENV_EXAMPLE"
    echo ""
fi

# Create .env file with private key (if it doesn't exist)
ENV_FILE="$NETWORK_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" << EOF
# Admin Account Configuration
ADMIN_ADDRESS=$ADDRESS
ADMIN_PRIVATE_KEY=$PRIVATE_KEY

# Besu Network Configuration
RPC_URL=http://localhost:8549
RPC_WS_URL=ws://localhost:8550
CHAIN_ID=1337
EOF
    echo "Created $ENV_FILE with private key"
    echo ""
    echo -e "\033[0;31mWARNING: The .env file contains sensitive information!\033[0m"
    echo "Make sure .env is in .gitignore and never commit it to version control."
else
    echo "Note: .env file already exists. Not overwriting."
    echo "To update admin account, manually edit .env file."
fi

echo ""
echo "=========================================="
echo "Admin account created successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Fund the admin account in genesis.json (add to 'alloc' section)"
echo "2. Or fund it after network starts using a funded account"
echo ""
echo "Admin Address: $ADDRESS"
echo ""
echo "To fund in genesis.json, add this entry to the 'alloc' section:"
echo "  \"$ADDRESS\": {"
echo "    \"balance\": \"0x200000000000000000000000000000000000000000000000000000000000000\""
echo "  }"
