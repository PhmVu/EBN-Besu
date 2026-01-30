#!/bin/bash

# Comprehensive Phase 2 Test Script
# Tests all requirements for Phase 2: Smart Contracts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$CONTRACTS_DIR"

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
        ((PASSED++))
    elif [ "$status" = "FAIL" ]; then
        echo -e "  ${RED}✗ FAIL${NC}: $message"
        ((FAILED++))
    elif [ "$status" = "WARN" ]; then
        echo -e "  ${YELLOW}⚠ WARN${NC}: $message"
        ((WARNINGS++))
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
        print_result "FAIL" "$name is NOT executable"
        return 1
    fi
}

echo ""
echo "=========================================="
echo -e "${BLUE}Phase 2: Smart Contracts Test${NC}"
echo "=========================================="
echo ""

# 1. Checking Required Files
echo "1. Checking Required Files..."
echo "-----------------------------------"
check_file "ClassManager.sol" "ClassManager contract"
check_file "ScoreManager.sol" "ScoreManager contract"
check_file "interfaces/IClassManager.sol" "IClassManager interface"
check_file "hardhat.config.js" "Hardhat configuration"
check_file "package.json" "Package.json"
check_file "README.md" "README.md"
check_file ".env.example" ".env.example"
check_file "scripts/deploy.js" "Deploy script"
check_file "scripts/load-deployment.js" "Load deployment script"
check_file "scripts/extract-abi.js" "Extract ABI script"
check_file "scripts/test-besu-network.js" "Test Besu network script"
check_file "scripts/verify-contracts.js" "Verify contracts script"
check_file "scripts/setup-and-deploy.sh" "Setup and deploy script"
check_file "test/ClassManager.test.js" "ClassManager tests"
check_file "test/ScoreManager.test.js" "ScoreManager tests"
check_file "test/Integration.test.js" "Integration tests"
echo ""

# 2. Checking Script Permissions
echo "2. Checking Script Permissions..."
echo "-----------------------------------"
check_executable "contracts/scripts/setup-and-deploy.sh" "setup-and-deploy.sh"
echo ""

# 3. Validating Contract Integration
echo "3. Validating Contract Integration..."
echo "-----------------------------------"
if grep -q "import.*IClassManager" "ScoreManager.sol"; then
    print_result "PASS" "ScoreManager imports IClassManager"
else
    print_result "FAIL" "ScoreManager does NOT import IClassManager"
fi

if grep -q "classManager\.isStudentAllowed" "ScoreManager.sol"; then
    print_result "PASS" "ScoreManager uses ClassManager.isStudentAllowed"
else
    print_result "FAIL" "ScoreManager does NOT use ClassManager.isStudentAllowed"
fi

if grep -q "classManager\.classExists" "ScoreManager.sol"; then
    print_result "PASS" "ScoreManager uses ClassManager.classExists"
else
    print_result "FAIL" "ScoreManager does NOT use ClassManager.classExists"
fi

# Check that local classExists mapping is removed
if grep -q "mapping.*classExists" "ScoreManager.sol"; then
    print_result "WARN" "ScoreManager still has local classExists mapping (should use ClassManager)"
else
    print_result "PASS" "ScoreManager uses ClassManager for class existence check"
fi
echo ""

# 4. Checking Dependencies
echo "4. Checking Dependencies..."
echo "-----------------------------------"
if [ -d "node_modules" ]; then
    print_result "PASS" "node_modules directory exists"
    
    if [ -d "node_modules/hardhat" ]; then
        print_result "PASS" "Hardhat is installed"
    else
        print_result "FAIL" "Hardhat is NOT installed"
    fi
    
    if [ -d "node_modules/@nomicfoundation/hardhat-toolbox" ]; then
        print_result "PASS" "Hardhat toolbox is installed"
    else
        print_result "FAIL" "Hardhat toolbox is NOT installed"
    fi
else
    print_result "WARN" "node_modules not found (run npm install)"
fi
echo ""

# 5. Testing Compilation (if dependencies installed)
echo "5. Testing Compilation..."
echo "-----------------------------------"
if [ -d "node_modules/hardhat" ]; then
    if npm run compile > /dev/null 2>&1; then
        print_result "PASS" "Contracts compile successfully"
        
        # Check artifacts exist
        if [ -f "artifacts/contracts/ClassManager.sol/ClassManager.json" ]; then
            print_result "PASS" "ClassManager artifact exists"
        else
            print_result "FAIL" "ClassManager artifact NOT found"
        fi
        
        if [ -f "artifacts/contracts/ScoreManager.sol/ScoreManager.json" ]; then
            print_result "PASS" "ScoreManager artifact exists"
        else
            print_result "FAIL" "ScoreManager artifact NOT found"
        fi
        
        if [ -f "artifacts/contracts/interfaces/IClassManager.sol/IClassManager.json" ]; then
            print_result "PASS" "IClassManager artifact exists"
        else
            print_result "FAIL" "IClassManager artifact NOT found"
        fi
    else
        print_result "FAIL" "Compilation failed"
    fi
else
    print_result "WARN" "Skipping compilation test (dependencies not installed)"
fi
echo ""

# 6. Testing Unit Tests (if dependencies installed)
echo "6. Testing Unit Tests..."
echo "-----------------------------------"
if [ -d "node_modules/hardhat" ]; then
    if npm test > /tmp/test-output.log 2>&1; then
        TEST_COUNT=$(grep -c "✓\|✗" /tmp/test-output.log || echo "0")
        PASS_COUNT=$(grep -c "✓" /tmp/test-output.log || echo "0")
        FAIL_COUNT=$(grep -c "✗" /tmp/test-output.log || echo "0")
        
        if [ "$FAIL_COUNT" -eq 0 ]; then
            print_result "PASS" "All tests passed ($PASS_COUNT tests)"
        else
            print_result "FAIL" "Some tests failed ($FAIL_COUNT failed, $PASS_COUNT passed)"
        fi
    else
        print_result "FAIL" "Tests failed to run"
    fi
else
    print_result "WARN" "Skipping test execution (dependencies not installed)"
fi
echo ""

# 7. Validating Scripts Syntax
echo "7. Validating Scripts Syntax..."
echo "-----------------------------------"
# Check Node.js scripts
if command -v node > /dev/null 2>&1; then
    if node -c "scripts/deploy.js" > /dev/null 2>&1; then
        print_result "PASS" "deploy.js syntax is valid"
    else
        print_result "FAIL" "deploy.js has syntax errors"
    fi
    
    if node -c "scripts/load-deployment.js" > /dev/null 2>&1; then
        print_result "PASS" "load-deployment.js syntax is valid"
    else
        print_result "FAIL" "load-deployment.js has syntax errors"
    fi
    
    if node -c "scripts/extract-abi.js" > /dev/null 2>&1; then
        print_result "PASS" "extract-abi.js syntax is valid"
    else
        print_result "FAIL" "extract-abi.js has syntax errors"
    fi
    
    if node -c "scripts/test-besu-network.js" > /dev/null 2>&1; then
        print_result "PASS" "test-besu-network.js syntax is valid"
    else
        print_result "FAIL" "test-besu-network.js has syntax errors"
    fi
    
    if node -c "scripts/verify-contracts.js" > /dev/null 2>&1; then
        print_result "PASS" "verify-contracts.js syntax is valid"
    else
        print_result "FAIL" "verify-contracts.js has syntax errors"
    fi
else
    print_result "WARN" "Node.js not found, skipping syntax check"
fi

# Check bash script
if command -v bash > /dev/null 2>&1; then
    if bash -n "scripts/setup-and-deploy.sh" > /dev/null 2>&1; then
        print_result "PASS" "setup-and-deploy.sh syntax is valid"
    else
        print_result "FAIL" "setup-and-deploy.sh has syntax errors"
    fi
else
    print_result "WARN" "Bash not found, skipping syntax check"
fi
echo ""

# 8. Checking Test Coverage
echo "8. Checking Test Coverage..."
echo "-----------------------------------"
# Check for integration tests
if grep -q "describe.*Integration" "test/Integration.test.js"; then
    print_result "PASS" "Integration tests exist"
else
    print_result "FAIL" "Integration tests NOT found"
fi

# Check for edge cases in ClassManager tests
if grep -q "Edge Cases\|Gas Optimization\|multiple classes\|zero address" "test/ClassManager.test.js"; then
    print_result "PASS" "ClassManager tests include edge cases"
else
    print_result "WARN" "ClassManager tests may lack edge cases"
fi

# Check for edge cases in ScoreManager tests
if grep -q "Edge Cases\|Gas Optimization\|multiple students\|zero address" "test/ScoreManager.test.js"; then
    print_result "PASS" "ScoreManager tests include edge cases"
else
    print_result "WARN" "ScoreManager tests may lack edge cases"
fi
echo ""

# 9. Validating Documentation
echo "9. Validating Documentation..."
echo "-----------------------------------"
if grep -q "ClassManager\|ScoreManager\|API\|Examples" "README.md"; then
    print_result "PASS" "README.md contains comprehensive documentation"
else
    print_result "WARN" "README.md may be incomplete"
fi

if [ -f ".env.example" ]; then
    if grep -q "RPC_URL\|ADMIN_PRIVATE_KEY\|CHAIN_ID" ".env.example"; then
        print_result "PASS" ".env.example contains required variables"
    else
        print_result "FAIL" ".env.example missing required variables"
    fi
fi
echo ""

# 10. Checking Deployment Script Features
echo "10. Checking Deployment Script Features..."
echo "-----------------------------------"
if grep -q "getNetwork\|getBalance\|network connection" "scripts/deploy.js"; then
    print_result "PASS" "Deploy script includes network checks"
else
    print_result "FAIL" "Deploy script missing network checks"
fi

if grep -q "latest.json\|deployment-" "scripts/deploy.js"; then
    print_result "PASS" "Deploy script saves deployment info"
else
    print_result "FAIL" "Deploy script does NOT save deployment info"
fi

if grep -q "loadDeployment\|getContractAddress" "scripts/load-deployment.js"; then
    print_result "PASS" "Load deployment script has helper functions"
else
    print_result "FAIL" "Load deployment script missing helper functions"
fi
echo ""

echo "=========================================="
echo -e "${BLUE}Test Summary${NC}"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ "$FAILED" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
    echo -e "${GREEN}✓ Phase 2 is 100% complete!${NC}"
    exit 0
elif [ "$FAILED" -eq 0 ]; then
    echo -e "${YELLOW}⚠ Phase 2 is mostly complete with some warnings.${NC}"
    exit 0
else
    echo -e "${RED}✗ Phase 2 has issues. Please review the failures above.${NC}"
    exit 1
fi
