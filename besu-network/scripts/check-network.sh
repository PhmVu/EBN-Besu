#!/bin/bash

# Script kiểm tra health của Besu Network
# Usage: ./check-network.sh

set -e

RPC_URL="http://localhost:8549"
RPC_NODE_VALIDATOR1="http://localhost:8545"

echo "=========================================="
echo "Besu Network Health Check"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check RPC endpoint
check_rpc() {
    local url=$1
    local name=$2
    
    echo -n "Checking $name ($url)... "
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        "$url" 2>/dev/null || echo "ERROR")
    
    if [[ "$response" == *"result"* ]]; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Function to get block number
get_block_number() {
    local url=$1
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        "$url")
    
    if [[ "$response" == *"result"* ]]; then
        echo "$response" | grep -o '"result":"[^"]*"' | cut -d'"' -f4
    else
        echo "0x0"
    fi
}

# Function to get peer count
get_peer_count() {
    local url=$1
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
        "$url")
    
    if [[ "$response" == *"result"* ]]; then
        echo "$response" | grep -o '"result":"[^"]*"' | cut -d'"' -f4
    else
        echo "0x0"
    fi
}

# Function to get validators
get_validators() {
    local url=$1
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"qbft_getValidatorsByBlockNumber","params":["latest"],"id":1}' \
        "$url")
    
    if [[ "$response" == *"result"* ]]; then
        echo "$response"
    else
        echo "[]"
    fi
}

# Check Docker containers
echo "1. Checking Docker containers..."
echo "-----------------------------------"
containers=("besu-validator1" "besu-validator2" "besu-validator3" "besu-rpc-node")
all_running=true

for container in "${containers[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        echo -e "  ${GREEN}✓${NC} $container is running"
    else
        echo -e "  ${RED}✗${NC} $container is NOT running"
        all_running=false
    fi
done

if [ "$all_running" = false ]; then
    echo ""
    echo -e "${RED}Error: Some containers are not running!${NC}"
    echo "Please start the network with: docker-compose up -d"
    exit 1
fi

echo ""
echo "2. Checking RPC endpoints..."
echo "-----------------------------------"

# Check RPC Node (main endpoint for students)
check_rpc "$RPC_URL" "RPC Node"
rpc_block=$(get_block_number "$RPC_URL")
rpc_peers=$(get_peer_count "$RPC_URL")

# Check Validator 1
check_rpc "$RPC_NODE_VALIDATOR1" "Validator 1"
val1_block=$(get_block_number "$RPC_NODE_VALIDATOR1")
val1_peers=$(get_peer_count "$RPC_NODE_VALIDATOR1")

echo ""
echo "3. Network Status..."
echo "-----------------------------------"
echo "RPC Node:"
echo "  Block Number: $rpc_block"
echo "  Peer Count: $rpc_peers"

echo ""
echo "Validator 1:"
echo "  Block Number: $val1_block"
echo "  Peer Count: $val1_peers"

# Check if blocks are being created
rpc_block_num=$((rpc_block))
if [ "$rpc_block_num" -gt 0 ]; then
    echo -e "  ${GREEN}✓${NC} Blocks are being created"
else
    echo -e "  ${YELLOW}⚠${NC} No blocks created yet (network may be starting)"
fi

# Check peer count (should be 3 for validators)
peer_count=$((val1_peers))
if [ "$peer_count" -ge 2 ]; then
    echo -e "  ${GREEN}✓${NC} Network has sufficient peers ($peer_count)"
else
    echo -e "  ${YELLOW}⚠${NC} Low peer count ($peer_count), network may still be syncing"
fi

echo ""
echo "4. Validators..."
echo "-----------------------------------"
validators=$(get_validators "$RPC_NODE_VALIDATOR1")
if [[ "$validators" == *"result"* ]]; then
    echo -e "${GREEN}✓${NC} Validators configured"
    echo "$validators" | python3 -m json.tool 2>/dev/null || echo "$validators"
else
    echo -e "${YELLOW}⚠${NC} Could not retrieve validators list"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Health check completed!${NC}"
echo "=========================================="
echo ""
echo "RPC Endpoint for students: $RPC_URL"
echo "WebSocket Endpoint: ws://localhost:8550"
