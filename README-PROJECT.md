# Besu Training System - Complete Implementation

Hệ thống đào tạo blockchain hoàn chỉnh sử dụng Hyperledger Besu cho sinh viên Fintech.

## Cấu trúc Dự án

```
EBN-Besu/
├── besu-network/          # Besu blockchain network
│   ├── config/           # Genesis và cấu hình
│   ├── data/             # Blockchain data
│   ├── scripts/          # Scripts quản lý network
│   └── docker-compose.yml
├── contracts/            # Smart contracts
│   ├── ClassManager.sol
│   ├── ScoreManager.sol
│   ├── scripts/          # Deploy scripts
│   └── test/             # Contract tests
├── backend/              # Backend API
│   ├── src/
│   │   ├── config/       # Configuration
│   │   ├── models/       # Database models
│   │   ├── services/     # Business logic
│   │   ├── controllers/  # API controllers
│   │   ├── routes/       # API routes
│   │   └── middleware/   # Auth & error handling
│   └── package.json
├── frontend/             # React frontend
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── services/     # API client
│   │   └── context/      # Auth context
│   └── package.json
├── docs/                 # Documentation
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── USER_GUIDE.md
│   └── ARCHITECTURE.md
└── docker-compose.full.yml  # Full system deployment
```

## Tính năng chính

### Cho Giáo viên
- Tạo và quản lý lớp học
- Thêm sinh viên vào lớp
- Đóng lớp học (chặn ghi mới)
- Xem tiến độ của sinh viên
- Chấm điểm trên blockchain

### Cho Sinh viên
- Nhận ví blockchain tự động
- Xem thông tin ví và RPC endpoint
- Deploy smart contracts qua Remix/VS Code
- Xem điểm số từ blockchain
- Xem danh sách lớp học

## Cài đặt nhanh

### 1. Khởi động Besu Network

```bash
cd besu-network
docker-compose up -d
./scripts/check-network.sh
```

### 2. Tạo Admin Account

```bash
./scripts/create-admin-account.sh
```

### 3. Deploy Smart Contracts

```bash
cd ../contracts
npm install
cp .env.example .env
# Edit .env với admin private key
npm run deploy:besu
```

### 4. Setup Database

```bash
# Tạo database PostgreSQL
createdb besu_training
```

### 5. Chạy Backend

```bash
cd ../backend
npm install
cp .env.example .env
# Edit .env với database và contract addresses
npm run migrate
npm start
```

### 6. Chạy Frontend

```bash
cd ../frontend
npm install
npm run dev
```

## Truy cập

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api
- **Besu RPC:** http://localhost:8549
- **Besu WebSocket:** ws://localhost:8550

## Tài liệu

- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [User Guide](docs/USER_GUIDE.md)
- [Architecture](docs/ARCHITECTURE.md)

## Công nghệ sử dụng

- **Blockchain:** Hyperledger Besu (QBFT consensus)
- **Smart Contracts:** Solidity 0.8.19
- **Backend:** Node.js + Express + PostgreSQL
- **Frontend:** React + Vite
- **Blockchain Library:** Ethers.js v6
- **Development:** Hardhat

## License

MIT
