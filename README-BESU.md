# EBN-Besu - Hyperledger Besu Private Network

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Besu](https://img.shields.io/badge/Besu-25.12.0-blue)](https://github.com/hyperledger/besu)
[![QBFT](https://img.shields.io/badge/Consensus-QBFT-green)](https://besu.hyperledger.org/en/stable/private-networks/how-to/configure/consensus/qbft/)

Mạng Blockchain private sử dụng Hyperledger Besu với cơ chế đồng thuận QBFT (Quorum Byzantine Fault Tolerance).

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt nhanh](#cài-đặt-nhanh)
- [Cấu hình mạng](#cấu-hình-mạng)
- [Sử dụng](#sử-dụng)
- [Kiểm tra](#kiểm-tra)
- [Troubleshooting](#troubleshooting)

## 🎯 Tổng quan

### Thông số mạng

- **Consensus**: QBFT (Quorum Byzantine Fault Tolerance)
- **Block Time**: 2 giây
- **Chain ID**: 1337
- **Số nodes**: 4 (3 validators + 1 RPC node)
- **Besu Version**: 25.12.0

### Cấu trúc mạng

| Node | Loại | RPC Port | WebSocket | P2P Port | IP Address |
|------|------|----------|-----------|----------|------------|
| validator1 | Validator | 8545 | 8546 | 30303 | 172.20.0.10 |
| validator2 | Validator | 8547 | - | 30304 | 172.20.0.11 |
| validator3 | Validator | 8548 | - | 30305 | 172.20.0.12 |
| rpc-node | RPC Node | 8549 | 8550 | 30306 | 172.20.0.13 |

## 💻 Yêu cầu hệ thống

### Windows (WSL2)
```bash
# 1. Cài đặt WSL2
wsl --install

# 2. Cài đặt Docker Desktop
# Tải từ: https://www.docker.com/products/docker-desktop

# 3. Bật WSL2 integration trong Docker Desktop
# Settings > Resources > WSL Integration > Enable integration
```

### Linux
```bash
# Cài đặt Docker và Docker Compose
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker $USER
```

### macOS
```bash
# Cài đặt Docker Desktop
# Tải từ: https://www.docker.com/products/docker-desktop
```

## 🚀 Cài đặt nhanh

### Bước 1: Clone repository

```bash
git clone https://github.com/PhmVu/EBN-Besu.git
cd EBN-Besu/besu-network
```

### Bước 2: Khởi động mạng

```bash
# Khởi động tất cả nodes
docker-compose up -d

# Xem logs để kiểm tra
docker-compose logs -f
```

### Bước 3: Kiểm tra mạng đã hoạt động

```bash
# Kiểm tra số peers (phải có 3 peers)
curl -X POST --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' http://localhost:8545

# Kiểm tra block number (phải > 0)
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545

# Kiểm tra danh sách validators
curl -X POST --data '{"jsonrpc":"2.0","method":"qbft_getValidatorsByBlockNumber","params":["latest"],"id":1}' http://localhost:8545
```

**Kết quả mong đợi:**
- Peer count: `0x3` (3 peers)
- Block number: Tăng dần theo thời gian
- Validators: 4 địa chỉ

## ⚙️ Cấu hình mạng

### Validators

Network có 4 validators được cấu hình sẵn:

| Validator | Address |
|-----------|---------|
| Validator 1 | `0x9a08b75b76d13bf9c45f5212fac126ddff4c5416` |
| Validator 2 | `0x12b1d0ee4d2a577065a5b95c7e8bfcf6c749c069` |
| Validator 3 | `0xb7b9a6365e53e63492728de15f52558d9d3bd3d8` |
| RPC Node | `0xbfd9930d1c73cd55333dd73b1d1f53fe67675cf5` |

### Genesis Configuration

- **Chain ID**: 1337
- **Gas Limit**: `0x1fffffffffffff`
- **Block Period**: 2 giây
- **Epoch Length**: 30,000 blocks
- **Request Timeout**: 10 giây

### RPC Endpoints

| Endpoint | URL | Mô tả |
|----------|-----|-------|
| HTTP RPC (Validator 1) | http://localhost:8545 | RPC chính |
| WebSocket (Validator 1) | ws://localhost:8546 | WebSocket |
| HTTP RPC (RPC Node) | http://localhost:8549 | RPC node chuyên dụng |
| WebSocket (RPC Node) | ws://localhost:8550 | WebSocket RPC node |

## 📖 Sử dụng

### Các lệnh Docker Compose cơ bản

```bash
# Khởi động network
docker-compose up -d

# Dừng network
docker-compose down

# Xem logs tất cả nodes
docker-compose logs -f

# Xem logs một node cụ thể
docker-compose logs -f validator1

# Xem trạng thái containers
docker-compose ps

# Restart một node
docker-compose restart validator1
```

### Kết nối với network

#### Sử dụng curl

```bash
# Lấy block mới nhất
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["latest",false],"id":1}' http://localhost:8545

# Lấy balance của một account
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x9a08b75b76d13bf9c45f5212fac126ddff4c5416","latest"],"id":1}' http://localhost:8545

# Gửi transaction (cần sign trước)
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":["0x..."],"id":1}' http://localhost:8545
```

#### Sử dụng Web3.js

```javascript
const Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');

// Lấy block number
web3.eth.getBlockNumber().then(console.log);

// Lấy danh sách accounts
web3.eth.getAccounts().then(console.log);
```

#### Sử dụng MetaMask

1. Mở MetaMask
2. Add Network với thông tin:
   - **Network Name**: EBN-Besu Local
   - **RPC URL**: http://localhost:8545
   - **Chain ID**: 1337
   - **Currency Symbol**: ETH

### RPC Methods có sẵn

#### Standard Ethereum APIs
- `eth_*` - Ethereum JSON-RPC methods
- `net_*` - Network methods
- `web3_*` - Web3 methods
- `txpool_*` - Transaction pool methods

#### QBFT Specific APIs (Validators only)
- `qbft_getValidatorsByBlockNumber` - Lấy danh sách validators
- `qbft_proposeValidatorVote` - Đề xuất thêm/xóa validator
- `qbft_discardValidatorVote` - Hủy vote

#### Admin APIs (Validators only)
- `admin_peers` - Xem danh sách peers
- `admin_addPeer` - Thêm peer
- `admin_removePeer` - Xóa peer

## 🔍 Kiểm tra

### Kiểm tra network health

```bash
# Script kiểm tra tổng quan
curl -X POST --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' http://localhost:8545 && \
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545 && \
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}' http://localhost:8545
```

### Kiểm tra consensus

```bash
# Xem block mới nhất với thông tin miner
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["latest",false],"id":1}' http://localhost:8545 | jq '.result.miner'

# Kiểm tra validators
curl -X POST --data '{"jsonrpc":"2.0","method":"qbft_getValidatorsByBlockNumber","params":["latest"],"id":1}' http://localhost:8545 | jq
```

### Monitoring

```bash
# Xem logs real-time
docker-compose logs -f --tail=100

# Kiểm tra resource usage
docker stats
```

## 🔧 Troubleshooting

### Nodes không kết nối với nhau

**Triệu chứng**: `net_peerCount` trả về `0x0`

**Giải pháp**:
```bash
# 1. Kiểm tra tất cả containers đang chạy
docker-compose ps

# 2. Restart network
docker-compose down
docker-compose up -d

# 3. Kiểm tra logs
docker-compose logs -f validator1
```

### Không tạo blocks

**Triệu chứng**: `eth_blockNumber` không tăng

**Giải pháp**:
```bash
# QBFT cần ít nhất 3 validators hoạt động
# Kiểm tra số validators đang chạy
docker-compose ps | grep validator

# Nếu thiếu validators, khởi động lại
docker-compose up -d
```

### Port đã được sử dụng

**Triệu chứng**: Error khi start: "port is already allocated"

**Giải pháp**:
```bash
# Kiểm tra ports đang sử dụng
netstat -ano | findstr :8545  # Windows
lsof -i :8545                 # Linux/Mac

# Dừng process hoặc thay đổi port trong docker-compose.yml
```

### Reset network hoàn toàn

```bash
# Dừng tất cả containers
docker-compose down

# Xóa toàn bộ dữ liệu blockchain
rm -rf data/*/database data/*/caches data/*/DATABASE_METADATA.json data/*/VERSION_METADATA.json

# Khởi động lại
docker-compose up -d
```

### Xem logs chi tiết

```bash
# Logs của một node cụ thể
docker-compose logs -f validator1

# Logs với timestamp
docker-compose logs -f --timestamps

# Logs 100 dòng cuối
docker-compose logs --tail=100
```

## 📁 Cấu trúc thư mục

```
EBN-Besu/
├── besu-network/
│   ├── config/
│   │   ├── genesis.json          # Genesis block configuration
│   │   └── qbftConfigFile.json   # QBFT config template
│   ├── data/
│   │   ├── validator1/
│   │   │   └── nodekey           # Private key của validator1
│   │   ├── validator2/
│   │   │   └── nodekey
│   │   ├── validator3/
│   │   │   └── nodekey
│   │   └── rpc-node/
│   │       └── nodekey
│   └── docker-compose.yml        # Docker Compose configuration
├── .gitignore
└── README.md
```

## 🔐 Bảo mật

**⚠️ LƯU Ý**: Network này được cấu hình cho môi trường **development/testing**

Để sử dụng trong production:

1. **Thay đổi private keys**: Tạo keys mới, không sử dụng keys có sẵn
2. **Cấu hình firewall**: Chỉ mở ports cần thiết
3. **Sử dụng HTTPS**: Cấu hình reverse proxy với SSL
4. **Authentication**: Thêm JWT authentication cho RPC endpoints
5. **Monitoring**: Setup monitoring và alerting

## 📚 Tài liệu tham khảo

- [Hyperledger Besu Documentation](https://besu.hyperledger.org/)
- [QBFT Consensus](https://besu.hyperledger.org/en/stable/private-networks/how-to/configure/consensus/qbft/)
- [JSON-RPC API](https://besu.hyperledger.org/en/stable/public-networks/reference/api/)

## 📝 License

MIT License - xem file LICENSE để biết thêm chi tiết

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request.

## 📧 Liên hệ

- GitHub: [@PhmVu](https://github.com/PhmVu)
- Repository: [EBN-Besu](https://github.com/PhmVu/EBN-Besu)
