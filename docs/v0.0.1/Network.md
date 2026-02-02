# PHASE 1: BESU NETWORK INFRASTRUCTURE

**Ngày cập nhật:** 02/02/2026  
**Trạng thái:** ✅ COMPLETE (100%)  
**Timeline:** 1-2 days

---

## 🏗️ TỔNG QUAN

Thiết lập mạng blockchain Hyperledger Besu với QBFT consensus cho hệ thống quản lý lớp học.

---

## 📋 THÀNH PHẦN MẠNG

### Network Configuration

| Thành phần | Chi tiết |
|-----------|---------|
| **Network Type** | Hyperledger Besu v25.12.0 |
| **Consensus** | QBFT (Quorum Byzantine Fault Tolerance) |
| **Chain ID** | 1337 |
| **Block Time** | 2 seconds |
| **Validators** | 3 (validator1, validator2, validator3) |
| **RPC Node** | 1 (rpc-node) |

### Network Topology

```
┌─────────────────┐
│  validator1     │
│  Port: 30303    │
└────────┬────────┘
         │
    ┌────┴────┐
    │          │
┌───▼──┐    ┌──▼───┐
│val2  │    │val3  │
│30304 │    │30305 │
└───┬──┘    └──┬───┘
    │          │
    └────┬─────┘
         │
    ┌────▼─────────┐
    │   rpc-node    │
    │ HTTP: 8549    │
    │  WS: 8550     │
    └───────────────┘
```

---

## 🔧 SETUP & CONFIGURATION

### docker-compose.yml

**File:** `besu-network/docker-compose.yml`

**Services:**

1. **validator1**
   - Image: `hyperledger/besu:latest`
   - Ports: 30303 (P2P), 8545 (HTTP)
   - Volume: `data/validator1`
   - Config: `config/qbftConfigFile.json`

2. **validator2**
   - Same setup as validator1
   - Ports: 30304 (P2P), 8546 (HTTP)
   - Volume: `data/validator2`

3. **validator3**
   - Same setup as validator1
   - Ports: 30305 (P2P), 8547 (HTTP)
   - Volume: `data/validator3`

4. **rpc-node**
   - Image: `hyperledger/besu:latest`
   - Ports: **8549 (HTTP RPC)**, **8550 (WebSocket RPC)**
   - Volume: `data/rpc-node`
   - No mining (syncs from validators)

### genesis.json Configuration

**File:** `besu-network/config/genesis.json`

**Key Settings:**

```json
{
  "config": {
    "chainId": 1337,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "qbft": {
      "blockperiodseconds": 2,
      "epochlength": 30000,
      "requesttimeoutseconds": 10
    }
  },
  "alloc": {
    "0x...admin_address": {
      "balance": "0xffffffffffffffffff"
    },
    "0x...validator1_address": {
      "balance": "0xffffffffffffffffff"
    },
    "0x...validator2_address": {
      "balance": "0xffffffffffffffffff"
    },
    "0x...validator3_address": {
      "balance": "0xffffffffffffffffff"
    }
  }
}
```

### QBFT Configuration

**File:** `besu-network/config/qbftConfigFile.json`

```json
{
  "validators": [
    {
      "address": "0x...validator1_address"
    },
    {
      "address": "0x...validator2_address"
    },
    {
      "address": "0x...validator3_address"
    }
  ]
}
```

---

## 🚀 KHỞI ĐỘNG & DỪNG MẠNG

### Start Network

**File:** `besu-network/scripts/start-network.sh`

```bash
#!/bin/bash
cd besu-network
docker-compose up -d
sleep 10
echo "✅ Besu network started"
```

**Command:**
```bash
bash besu-network/scripts/start-network.sh
```

### Stop Network

**File:** `besu-network/scripts/stop-network.sh`

```bash
#!/bin/bash
cd besu-network
docker-compose down
echo "✅ Besu network stopped"
```

**Command:**
```bash
bash besu-network/scripts/stop-network.sh
```

---

## ✅ KIỂM TRA MẠNG

### Health Check

**Method 1: eth_blockNumber**

```bash
curl http://localhost:8549 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Expected response:
# {"jsonrpc":"2.0","result":"0x1a4","id":1}
```

**Method 2: eth_chainId**

```bash
curl http://localhost:8549 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Expected response:
# {"jsonrpc":"2.0","result":"0x539","id":1}
```

**Method 3: net_peerCount**

```bash
curl http://localhost:8549 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'

# Should return 3 peers (3 validators)
```

### Check Network Status

**File:** `besu-network/scripts/check-network.sh`

```bash
#!/bin/bash
echo "🔍 Checking Besu Network..."

BLOCK=$(curl -s http://localhost:8549 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | jq -r '.result')

PEERS=$(curl -s http://localhost:8549 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
  | jq -r '.result')

echo "📊 Current Block: $BLOCK"
echo "👥 Connected Peers: $((16#${PEERS:2}))"
echo "✅ Network is healthy"
```

**Run:**
```bash
bash besu-network/scripts/check-network.sh
```

---

## 🔑 ADMIN ACCOUNT SETUP

### Create Admin Account

**File:** `besu-network/scripts/create-admin-account.sh`

```bash
#!/bin/bash
# Generate admin account (do not commit private key)
ADMIN_ADDRESS=$(node -e "
const ethers = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log(wallet.address);
process.env.ADMIN_PRIVATE_KEY = wallet.privateKey;
")

echo "✅ Admin account created: $ADMIN_ADDRESS"
echo "Store ADMIN_PRIVATE_KEY in .env (do not commit)"
```

### Fund Admin Account

**In genesis.json:**
```json
"alloc": {
  "0x...admin_address": {
    "balance": "0xffffffffffffffffff"
  }
}
```

---

## 📡 RPC ENDPOINTS

### Available Endpoints

**HTTP RPC:** `http://localhost:8549`

**WebSocket RPC:** `ws://localhost:8550`

### Supported Methods

✅ **Ethereum Methods:**
- eth_blockNumber
- eth_chainId
- eth_accounts
- eth_getBalance
- eth_sendTransaction
- eth_sendRawTransaction
- eth_getTransactionReceipt
- eth_call
- eth_estimateGas

✅ **Web3 Methods:**
- web3_clientVersion
- web3_sha3

✅ **Net Methods:**
- net_version
- net_listening
- net_peerCount

✅ **Txpool Methods:**
- txpool_besuPendingTransactions
- txpool_besuStatistics

---

## 🔗 BESU EXPLORER (OPTIONAL)

### Setup Block Explorer

```bash
# Clone Besu network explorer
git clone https://github.com/hyperledger/besu-explorer.git
cd besu-explorer

# Configure to connect to localhost:8549
# Update config.json:
{
  "rpcUrl": "http://localhost:8549"
}

# Start explorer
npm install && npm start
# Access at http://localhost:3000
```

---

## 🧪 VERIFICATION CHECKLIST

- [ ] Docker daemon running
- [ ] `docker-compose up -d` successful
- [ ] All 4 containers running (3 validators + 1 RPC node)
- [ ] Health check returns valid block number
- [ ] At least 3 peers connected
- [ ] RPC-node responds to JSON-RPC calls
- [ ] Admin account created and funded
- [ ] Genesis block created successfully

---

## 📊 NETWORK METRICS

| Metric | Value |
|--------|-------|
| **Validators** | 3 |
| **RPC Nodes** | 1 |
| **Expected Peers per Validator** | 2 (other validators) |
| **Expected Peers for RPC Node** | 3 (all validators) |
| **Block Time** | 2 seconds |
| **Max Block Size** | ~30,000 gas (default Besu) |
| **Consensus Tolerance** | 1 Byzantine validator (2/3 honest) |

---

## 🚨 TROUBLESHOOTING

### Issue: Container won't start

```bash
# Check logs
docker-compose logs validator1

# Try rebuilding
docker-compose down
docker-compose up --build -d
```

### Issue: Peers not connecting

```bash
# Check network connectivity
docker exec validator1 besu --version

# Check logs for connection attempts
docker-compose logs | grep "peer\|connection"
```

### Issue: RPC-node not syncing

```bash
# Check block height
curl http://localhost:8549 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check peer count
curl http://localhost:8549 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'
```

### Issue: Transaction failing

```bash
# Check gas estimation
curl http://localhost:8549 -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_estimateGas",
    "params":[{
      "from":"0x...",
      "to":"0x...",
      "value":"0x1000"
    }],
    "id":1
  }'
```

---

## 📚 KEY FILES

| File | Purpose |
|------|---------|
| `besu-network/docker-compose.yml` | Network definition |
| `besu-network/config/genesis.json` | Genesis block config |
| `besu-network/config/qbftConfigFile.json` | QBFT validator config |
| `besu-network/scripts/start-network.sh` | Start script |
| `besu-network/scripts/stop-network.sh` | Stop script |
| `besu-network/scripts/check-network.sh` | Health check script |
| `besu-network/data/` | Persistent data (blockchains) |

---

**Status:** ✅ READY FOR PHASE 2  
**Last Updated:** 02/02/2026 17:00 UTC
