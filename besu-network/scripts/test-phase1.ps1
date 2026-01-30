# Test script for Phase 1: Besu Network Infrastructure
# PowerShell version for Windows

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Phase 1: Besu Network Infrastructure Test" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$testResults = @()

# Test 1: Check Docker containers
Write-Host "Test 1: Checking Docker containers..." -ForegroundColor Yellow
try {
    $containers = docker ps --format "{{.Names}}" 2>&1
    $expectedContainers = @("besu-validator1", "besu-validator2", "besu-validator3", "besu-rpc-node")
    $allRunning = $true
    
    foreach ($container in $expectedContainers) {
        if ($containers -match $container) {
            Write-Host "  [OK] $container is running" -ForegroundColor Green
        } else {
            Write-Host "  [FAIL] $container is NOT running" -ForegroundColor Red
            $allRunning = $false
        }
    }
    
    if ($allRunning) {
        $testResults += @{Test = "Docker Containers"; Status = "PASS"}
    } else {
        $testResults += @{Test = "Docker Containers"; Status = "FAIL"}
    }
} catch {
    Write-Host "  [ERROR] Could not check containers: $_" -ForegroundColor Red
    $testResults += @{Test = "Docker Containers"; Status = "ERROR"}
}

Write-Host ""

# Test 2: Check RPC Node endpoint (Port 8549)
Write-Host "Test 2: Testing RPC Node endpoint (http://localhost:8549)..." -ForegroundColor Yellow
try {
    $body = @{
        jsonrpc = "2.0"
        method = "eth_blockNumber"
        params = @()
        id = 1
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:8549" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.result) {
        $blockNumber = [Convert]::ToInt64($result.result, 16)
        Write-Host "  [OK] RPC Node is responding" -ForegroundColor Green
        Write-Host "  Block Number: $blockNumber" -ForegroundColor Gray
        $testResults += @{Test = "RPC Node Endpoint"; Status = "PASS"; BlockNumber = $blockNumber}
    } else {
        Write-Host "  [FAIL] RPC Node returned invalid response" -ForegroundColor Red
        $testResults += @{Test = "RPC Node Endpoint"; Status = "FAIL"}
    }
} catch {
    Write-Host "  [FAIL] RPC Node is not accessible: $_" -ForegroundColor Red
    $testResults += @{Test = "RPC Node Endpoint"; Status = "FAIL"}
}

Write-Host ""

# Test 3: Check Peer Count
Write-Host "Test 3: Checking network peer count..." -ForegroundColor Yellow
try {
    $body = @{
        jsonrpc = "2.0"
        method = "net_peerCount"
        params = @()
        id = 1
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:8549" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.result) {
        $peerCount = [Convert]::ToInt64($result.result, 16)
        Write-Host "  [OK] Peer count: $peerCount" -ForegroundColor Green
        if ($peerCount -ge 2) {
            Write-Host "  [OK] Network has sufficient peers" -ForegroundColor Green
            $testResults += @{Test = "Peer Count"; Status = "PASS"; PeerCount = $peerCount}
        } else {
            Write-Host "  [WARN] Low peer count, network may still be syncing" -ForegroundColor Yellow
            $testResults += @{Test = "Peer Count"; Status = "WARN"; PeerCount = $peerCount}
        }
    }
} catch {
    Write-Host "  [FAIL] Could not get peer count: $_" -ForegroundColor Red
    $testResults += @{Test = "Peer Count"; Status = "FAIL"}
}

Write-Host ""

# Test 4: Check Validators (from validator1)
Write-Host "Test 4: Checking validators..." -ForegroundColor Yellow
try {
    $body = @{
        jsonrpc = "2.0"
        method = "qbft_getValidatorsByBlockNumber"
        params = @("latest")
        id = 1
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:8545" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.result) {
        $validators = $result.result
        Write-Host "  [OK] Found $($validators.Count) validators" -ForegroundColor Green
        foreach ($validator in $validators) {
            Write-Host "    - $validator" -ForegroundColor Gray
        }
        $testResults += @{Test = "Validators"; Status = "PASS"; Count = $validators.Count}
    }
} catch {
    Write-Host "  [WARN] Could not get validators (may need ADMIN API): $_" -ForegroundColor Yellow
    $testResults += @{Test = "Validators"; Status = "WARN"}
}

Write-Host ""

# Test 5: Check Scripts exist
Write-Host "Test 5: Checking management scripts..." -ForegroundColor Yellow
$scripts = @("check-network.sh", "start-network.sh", "stop-network.sh", "create-admin-account.sh")
$scriptsPath = Join-Path $PSScriptRoot ".."
$allScriptsExist = $true

foreach ($script in $scripts) {
    $scriptPath = Join-Path $scriptsPath $script
    if (Test-Path $scriptPath) {
        Write-Host "  [OK] $script exists" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $script not found" -ForegroundColor Red
        $allScriptsExist = $false
    }
}

if ($allScriptsExist) {
    $testResults += @{Test = "Management Scripts"; Status = "PASS"}
} else {
    $testResults += @{Test = "Management Scripts"; Status = "FAIL"}
}

Write-Host ""

# Test 6: Check Configuration files
Write-Host "Test 6: Checking configuration files..." -ForegroundColor Yellow
$configPath = Join-Path $PSScriptRoot "..\config"
$genesisPath = Join-Path $configPath "genesis.json"

if (Test-Path $genesisPath) {
    Write-Host "  [OK] genesis.json exists" -ForegroundColor Green
    $genesis = Get-Content $genesisPath | ConvertFrom-Json
    Write-Host "    Chain ID: $($genesis.config.chainId)" -ForegroundColor Gray
    Write-Host "    QBFT Block Period: $($genesis.config.qbft.blockperiodseconds) seconds" -ForegroundColor Gray
    $testResults += @{Test = "Configuration Files"; Status = "PASS"}
} else {
    Write-Host "  [FAIL] genesis.json not found" -ForegroundColor Red
    $testResults += @{Test = "Configuration Files"; Status = "FAIL"}
}

Write-Host ""

# Test 7: Check RPC APIs available
Write-Host "Test 7: Testing RPC APIs..." -ForegroundColor Yellow
$apis = @("eth_blockNumber", "net_peerCount", "eth_syncing")
$apiWorking = 0

foreach ($api in $apis) {
    try {
        $body = @{
            jsonrpc = "2.0"
            method = $api
            params = @()
            id = 1
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "http://localhost:8549" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -ErrorAction Stop -TimeoutSec 5
        $result = $response.Content | ConvertFrom-Json
        
        if ($result.result -or $result.error) {
            Write-Host "  [OK] $api is available" -ForegroundColor Green
            $apiWorking++
        }
    } catch {
        Write-Host "  [FAIL] $api failed: $_" -ForegroundColor Red
    }
}

if ($apiWorking -eq $apis.Count) {
    $testResults += @{Test = "RPC APIs"; Status = "PASS"; Working = $apiWorking; Total = $apis.Count}
} else {
    $testResults += @{Test = "RPC APIs"; Status = "WARN"; Working = $apiWorking; Total = $apis.Count}
}

Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$warned = ($testResults | Where-Object { $_.Status -eq "WARN" }).Count

Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "Warnings: $warned" -ForegroundColor $(if ($warned -eq 0) { "Green" } else { "Yellow" })
Write-Host ""

if ($failed -eq 0) {
    Write-Host "Phase 1 Tests: PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Phase 1 Tests: FAILED" -ForegroundColor Red
    exit 1
}
