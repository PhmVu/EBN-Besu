#!/bin/bash

# Comprehensive Phase 1 Test Script
# Tests all requirements for Phase 1: Besu Network Infrastructure

set +e  # Don't exit on error, we want to collect all test results

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0
WARNINGS=0

# Function to print test result
print_result() {
    local status=$1
    local message=$2
    if [ "$status" = "PASS" ]; then
        echo -e "  ${GREEN}✓ PASS${NC}: $message"
        PASSED=$((PASSED + 1))
    elif [ "$status" = "FAIL" ]; then
        echo -e "  ${RED}✗ FAIL${NC}: $message"
        FAILED=$((FAILED + 1))
    elif [ "$status" = "WARN" ]; then
        echo -e "  ${YELLOW}⚠ WARN${NC}: $message"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# Function to check if file exists
check_file() {
    local file=$1
    local name=$2
    if [ -f "$file" ]; then
        print_result "PASS" "$name exists: $file"
        return 0
    else
        print_result "FAIL" "$name NOT found: $file"
        return 1
    fi
}

# Function to check if script is executable
check_executable() {
    local file=$1
    local name=$2
    if [ -x "$file" ]; then
        print_result "PASS" "$name is executable"
        return 0
    else
        print_result "WARN" "$name is not executable (will fix)"
        chmod +x "$file"
        return 0
    fi
}

# Function to test RPC endpoint
test_rpc() {
    local url=$1
    local name=$2
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        "$url" 2>/dev/null || echo "ERROR")
    
    if [[ "$response" == *"result"* ]] && [[ "$response" != *"ERROR"* ]]; then
        print_result "PASS" "$name RPC endpoint is responding"
        return 0
    else
        print_result "FAIL" "$name RPC endpoint is NOT responding"
        return 1
    fi
}

echo ""
echo "=========================================="
echo -e "${BLUE}Phase 1: Besu Network Infrastructure Test${NC}"
echo "=========================================="
echo ""

# Test 1: Check required files
echo "1. Checking Required Files..."
echo "-----------------------------------"

check_file "besu-network/config/genesis.json" "Genesis configuration"
check_file "besu-network/docker-compose.yml" "Docker Compose configuration"
check_file "besu-network/scripts/check-network.sh" "Check network script"
check_file "besu-network/scripts/start-network.sh" "Start network script"
check_file "besu-network/scripts/stop-network.sh" "Stop network script"
check_file "besu-network/scripts/create-admin-account.sh" "Create admin account script"

# Test 2: Check scripts are executable
echo ""
echo "2. Checking Script Permissions..."
echo "-----------------------------------"

check_executable "besu-network/scripts/check-network.sh" "check-network.sh"
check_executable "besu-network/scripts/start-network.sh" "start-network.sh"
check_executable "besu-network/scripts/stop-network.sh" "stop-network.sh"
check_executable "besu-network/scripts/create-admin-account.sh" "create-admin-account.sh"

# Test 3: Validate genesis.json structure
echo ""
echo "3. Validating Genesis Configuration..."
echo "-----------------------------------"

if [ -f "besu-network/config/genesis.json" ]; then
    # Check for required fields
    if grep -q '"chainId"' besu-network/config/genesis.json; then
        print_result "PASS" "Genesis has chainId"
    else
        print_result "FAIL" "Genesis missing chainId"
    fi
    
    if grep -q '"qbft"' besu-network/config/genesis.json; then
        print_result "PASS" "Genesis has QBFT configuration"
    else
        print_result "FAIL" "Genesis missing QBFT configuration"
    fi
    
    if grep -q '"blockperiodseconds"' besu-network/config/genesis.json; then
        print_result "PASS" "Genesis has block period configuration"
    else
        print_result "FAIL" "Genesis missing block period"
    fi
    
    # Check for pre-funded accounts
    alloc_count=$(grep -c '"balance"' besu-network/config/genesis.json || echo "0")
    if [ "$alloc_count" -ge 1 ]; then
        print_result "PASS" "Genesis has pre-funded accounts ($alloc_count)"
    else
        print_result "WARN" "Genesis may not have pre-funded accounts"
    fi
fi

# Test 4: Check Docker containers
echo ""
echo "4. Checking Docker Containers..."
echo "-----------------------------------"

containers=("besu-validator1" "besu-validator2" "besu-validator3" "besu-rpc-node")
all_running=true

for container in "${containers[@]}"; do
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${container}$"; then
        status=$(docker ps --format '{{.Status}}' --filter "name=${container}" 2>/dev/null | head -1)
        if echo "$status" | grep -q "healthy\|Up"; then
            print_result "PASS" "$container is running and healthy"
        else
            print_result "WARN" "$container is running but status unclear: $status"
        fi
    else
        print_result "FAIL" "$container is NOT running"
        all_running=false
    fi
done

# Test 5: Test RPC Endpoints
echo ""
echo "5. Testing RPC Endpoints..."
echo "-----------------------------------"

if [ "$all_running" = true ]; then
    test_rpc "http://localhost:8549" "RPC Node (port 8549)"
    test_rpc "http://localhost:8545" "Validator 1 (port 8545)"
    test_rpc "http://localhost:8547" "Validator 2 (port 8547)"
    test_rpc "http://localhost:8548" "Validator 3 (port 8548)"
else
    print_result "WARN" "Skipping RPC tests - containers not running"
fi

# Test 6: Test Network Health (if containers running)
echo ""
echo "6. Testing Network Health..."
echo "-----------------------------------"

if [ "$all_running" = true ]; then
    # Get block number
    block_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        "http://localhost:8549" 2>/dev/null)
    
    if [[ "$block_response" == *"result"* ]]; then
        block_hex=$(echo "$block_response" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
        block_num=$((block_hex))
        if [ "$block_num" -gt 0 ]; then
            print_result "PASS" "Network is creating blocks (current: $block_num)"
        else
            print_result "WARN" "Network started but no blocks yet"
        fi
    fi
    
    # Get peer count
    peer_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
        "http://localhost:8549" 2>/dev/null)
    
    if [[ "$peer_response" == *"result"* ]]; then
        peer_hex=$(echo "$peer_response" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
        peer_num=$((peer_hex))
        if [ "$peer_num" -ge 2 ]; then
            print_result "PASS" "Network has sufficient peers ($peer_num)"
        else
            print_result "WARN" "Network has low peer count ($peer_num)"
        fi
    fi
    
    # Check syncing status
    sync_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}' \
        "http://localhost:8549" 2>/dev/null)
    
    if [[ "$sync_response" == *"false"* ]]; then
        print_result "PASS" "Network is fully synced"
    else
        print_result "WARN" "Network may still be syncing"
    fi
else
    print_result "WARN" "Skipping network health tests - containers not running"
fi

# Test 7: Check RPC Node APIs
echo ""
echo "7. Checking RPC Node APIs..."
echo "-----------------------------------"

if [ "$all_running" = true ]; then
    # Test ETH API
    eth_test=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        "http://localhost:8549" 2>/dev/null)
    if [[ "$eth_test" == *"result"* ]]; then
        print_result "PASS" "ETH API is available"
    else
        print_result "FAIL" "ETH API is NOT available"
    fi
    
    # Test NET API
    net_test=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
        "http://localhost:8549" 2>/dev/null)
    if [[ "$net_test" == *"result"* ]]; then
        print_result "PASS" "NET API is available"
    else
        print_result "FAIL" "NET API is NOT available"
    fi
    
    # Test WEB3 API
    web3_test=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}' \
        "http://localhost:8549" 2>/dev/null)
    if [[ "$web3_test" == *"result"* ]]; then
        print_result "PASS" "WEB3 API is available"
    else
        print_result "FAIL" "WEB3 API is NOT available"
    fi
else
    print_result "WARN" "Skipping API tests - containers not running"
fi

# Test 8: Check Ports
echo ""
echo "8. Checking Exposed Ports..."
echo "-----------------------------------"

if [ "$all_running" = true ]; then
    # Check RPC Node ports
    if docker ps --format '{{.Ports}}' --filter "name=besu-rpc-node" | grep -q "8549"; then
        print_result "PASS" "RPC Node HTTP port 8549 is exposed"
    else
        print_result "FAIL" "RPC Node HTTP port 8549 is NOT exposed"
    fi
    
    if docker ps --format '{{.Ports}}' --filter "name=besu-rpc-node" | grep -q "8550"; then
        print_result "PASS" "RPC Node WebSocket port 8550 is exposed"
    else
        print_result "FAIL" "RPC Node WebSocket port 8550 is NOT exposed"
    fi
else
    print_result "WARN" "Skipping port checks - containers not running"
fi

# Test 9: Validate docker-compose.yml
echo ""
echo "9. Validating Docker Compose Configuration..."
echo "-----------------------------------"

if [ -f "besu-network/docker-compose.yml" ]; then
    # Check for required services
    if grep -q "validator1:" besu-network/docker-compose.yml; then
        print_result "PASS" "docker-compose.yml has validator1 service"
    else
        print_result "FAIL" "docker-compose.yml missing validator1"
    fi
    
    if grep -q "validator2:" besu-network/docker-compose.yml; then
        print_result "PASS" "docker-compose.yml has validator2 service"
    else
        print_result "FAIL" "docker-compose.yml missing validator2"
    fi
    
    if grep -q "validator3:" besu-network/docker-compose.yml; then
        print_result "PASS" "docker-compose.yml has validator3 service"
    else
        print_result "FAIL" "docker-compose.yml missing validator3"
    fi
    
    if grep -q "rpc-node:" besu-network/docker-compose.yml; then
        print_result "PASS" "docker-compose.yml has rpc-node service"
    else
        print_result "FAIL" "docker-compose.yml missing rpc-node"
    fi
    
    # Check for network configuration
    if grep -q "besu-network:" besu-network/docker-compose.yml; then
        print_result "PASS" "docker-compose.yml has network configuration"
    else
        print_result "WARN" "docker-compose.yml may be missing network configuration"
    fi
fi

# Summary
echo ""
echo "=========================================="
echo -e "${BLUE}Test Summary${NC}"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✓ Phase 1 is 100% complete!${NC}"
        echo ""
        exit 0
    else
        echo -e "${YELLOW}⚠ Phase 1 is mostly complete with some warnings.${NC}"
        echo ""
        exit 0
    fi
else
    echo -e "${RED}✗ Phase 1 has failures. Please fix the issues above.${NC}"
    echo ""
    exit 1
fi
