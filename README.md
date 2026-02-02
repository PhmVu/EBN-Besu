# EBN-Besu: Hệ thống Đào tạo Blockchain Fintech

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Besu v25.12.0](https://img.shields.io/badge/Besu-25.12.0-blue)](https://github.com/hyperledger/besu)
[![QBFT](https://img.shields.io/badge/Consensus-QBFT-green)](https://besu.hyperledger.org)
[![Status](https://img.shields.io/badge/Status-95%25%20Complete-success)](docs/FINAL_TEST_STATUS.md)

Hệ thống đào tạo blockchain hoàn chỉnh sử dụng **Hyperledger Besu** cho sinh viên Fintech. Sinh viên tự phát triển smart contract, deploy lên blockchain thực, sử dụng MetaMask để quản lý wallet, và giáo viên duyệt quyền + chấm điểm on-chain.

## 📋 Cấu trúc Dự án

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

### Cho Giáo viên ✅
- ✅ Tạo lớp học (on-chain via ClassManager)
- ✅ Duyệt sinh viên + cấp quyền (on-chain whitelist)
- ✅ Tạo & quản lý assignments
- ✅ Xem submissions & chấm điểm (on-chain via ScoreManager)
- ✅ Xem thống kê lớp học (total students, assignments, average score)

### Cho Sinh viên ✅
- ✅ Đăng ký tài khoản → tạo ví tự động (address + encrypted private key)
- ✅ Gửi yêu cầu tham gia lớp → chờ teacher duyệt
- ✅ Được whitelist on-chain → có quyền tương tác
- ✅ Làm smart contract cá nhân (Solidity)
- ✅ Deploy via Remix IDE + MetaMask (kết nối RPC endpoint)
- ✅ Nộp assignment (ghi assignmentHash on-chain)
- ✅ Xem điểm số & thống kê cá nhân

## 🚀 Cài đặt & Chạy Nhanh

### Bước 1: Clone & Chuẩn bị

```bash
git clone https://github.com/PhmVu/EBN-Besu.git
cd EBN-Besu/besu-network
```

### Bước 2: Khởi động Besu Network

```bash
docker-compose up -d
sleep 10
# Kiểm tra network
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545
```

### Bước 3: Chạy Backend + Database

```bash
cd ..
docker-compose -f besu-network/docker-compose.yml up -d
# Backend sẽ tự chạy migration & deploy contracts
```

### Bước 4: Truy cập

- **Backend API:** http://localhost:3000/api
- **Besu RPC:** http://localhost:8545 hoặc http://localhost:8549
- **Besu WebSocket:** ws://localhost:8546 hoặc ws://localhost:8550

## 📊 Trạng thái Hệ thống

| Thành phần | Trạng thái | Chi tiết |
|-----------|-----------|---------|
| **Besu Network** | ✅ 100% | 4 nodes (3 validators + 1 RPC), QBFT, sealing blocks |
| **Smart Contracts** | ✅ 100% | ClassManager + ScoreManager deployed on-chain |
| **Backend API** | ✅ 100% | 19/19 endpoints tested & working |
| **Database** | ✅ 100% | PostgreSQL 15, 9 tables, auto-migration |
| **Frontend** | ⏳ 5% | UI development pending |

## 🔍 API Endpoints (19/19 Tested ✅)

### Authentication (4)
- `POST /api/auth/register` - Đăng ký (teacher/student auto-generate wallet)
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user
- `POST /api/auth/wallet-key` - Lấy private key (show-once policy)

### Classes (5)
- `POST /api/classes` - Tạo lớp (on-chain)
- `GET /api/classes` - Danh sách lớp của teacher
- `GET /api/classes/:id` - Chi tiết lớp
- `GET /api/classes/:id/statistics` - Thống kê lớp
- `POST /api/classes/:id/close` - Đóng lớp

### Assignments (5)
- `POST /api/classes/:classId/assignments` - Tạo assignment
- `GET /api/classes/:classId/assignments` - Danh sách assignments
- `GET /api/assignments/:id` - Chi tiết assignment
- `PUT /api/assignments/:id` - Cập nhật assignment
- `DELETE /api/assignments/:id` - Xóa assignment

### Submissions (4)
- `POST /api/assignments/:id/submit` - Student nộp bài
- `GET /api/assignments/:id/submissions` - Teacher xem submissions
- `GET /api/assignments/:id/my-submission` - Student xem bài của mình
- `POST /api/assignments/:id/submissions/:studentId/score` - Teacher chấm điểm (on-chain)

### Approvals (4)
- `POST /api/classes/:classId/request-approval` - Student yêu cầu join
- `GET /api/classes/:classId/approvals` - Teacher xem pending approvals
- `POST /api/approvals/:id/approve` - Teacher approve + whitelist (on-chain)
- `POST /api/approvals/:id/reject` - Teacher reject

### Students (3)
- `GET /api/students/my-wallet` - Xem thông tin ví
- `GET /api/students/my-classes` - Lớp học của student
- `GET /api/students/my-scores` - Điểm số & thống kê

## 🏗️ Kiến trúc

```
┌─────────────────┐
│   Browser/IDE   │
│  (Remix/VS Code)│
└────────┬────────┘
         │ HTTP/WS
┌────────▼────────────────────┐
│  Backend API (Node.js)       │
│  - Auth & Role-based ACL     │
│  - Business Logic            │
│  - Database Migration        │
└────────┬────────────────────┘
         │
    ┌────┴────────────────┐
    │                     │
    ▼                     ▼
┌──────────────┐    ┌──────────────────┐
│ PostgreSQL   │    │  Besu Network    │
│ (9 tables)   │    │  (4 nodes, QBFT) │
└──────────────┘    └──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   ┌────────┐        ┌────────┐        ┌──────────┐
   │ Val 1  │        │ Val 2  │        │ RPC Node │
   └────────┘        └────────┘        └──────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                ┌──────────▼──────────┐
              ┌─┴─────────────────────┴─┐
              │  ClassManager Contract  │
              │  ScoreManager Contract  │
              └─────────────────────────┘
```

## 📝 Luồng Hoạt động

### Luồng Sinh viên
1. **Register** → Hệ thống tạo ví tự động (address + encrypted private key)
2. **Request Approval** → Gửi yêu cầu join lớp
3. **Wait for Teacher Approval** → Giáo viên duyệt
4. **Get Whitelist** → Được ghi on-chain trong ClassManager.allowedStudents
5. **Dev Smart Contract** → Tự code Solidity theo đề bài
6. **Deploy via Remix + MetaMask** → Kết nối RPC endpoint lớp học
7. **Submit Assignment** → Ghi assignmentHash on-chain
8. **View Score** → Xem điểm từ ScoreManager contract

### Luồng Giáo viên
1. **Create Class** → Ghi on-chain ClassManager.createClass()
2. **Review Approval Requests** → Xem danh sách sinh viên chờ duyệt
3. **Approve Student** → Gọi ClassManager.addStudent() + whitelist
4. **Create Assignments** → Tạo assignments trong database
5. **Grade Submissions** → Gọi ScoreManager.recordScore() ghi điểm on-chain
6. **View Statistics** → Xem thống kê: tổng sinh viên, assignments, điểm trung bình

## 🔐 Bảo mật & Phân quyền

- **Student Wallet:** Auto-generated khi đăng ký, encrypted private key (AES-256-CBC)
- **Permission:** Classroom-level namespace (classId), on-chain whitelist via ClassManager
- **Authentication:** JWT tokens + role-based access control
- **On-chain Permission:** ClassManager.allowedStudents[classId][studentAddress]
- **Smart Contract:** Chỉ approved students mới có thể ghi on-chain

## 🔧 Troubleshooting

### Network không sealing blocks
```bash
# Kiểm tra validators
curl -X POST --data '{"jsonrpc":"2.0","method":"qbft_getValidatorsByBlockNumber","params":["latest"],"id":1}' http://localhost:8545

# Restart network
docker-compose -f besu-network/docker-compose.yml restart
```

### Student không submit được assignment
- Kiểm tra xem student đã được approved chưa
- Kiểm tra student có trong students table (enrollment) không
- Kiểm tra ClassManager.allowedStudents[classId][studentAddress] on-chain

### Backend migration failed
```bash
# Xóa database & restart
docker-compose -f besu-network/docker-compose.yml down -v
docker-compose -f besu-network/docker-compose.yml up -d
```

## 📚 Tài liệu

- [Architecture Design](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [User Guide](docs/USER_GUIDE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Test Status](FINAL_TEST_STATUS.md)

## 🛠️ Công nghệ Sử dụng

| Layer | Technology | Version |
|-------|-----------|---------|
| Blockchain | Hyperledger Besu | 25.12.0 |
| Consensus | QBFT | Built-in |
| Smart Contracts | Solidity | 0.8.19 |
| Backend | Node.js | 18-bullseye-slim |
| Framework | Express.js | Latest |
| Database | PostgreSQL | 15 |
| Blockchain Library | Ethers.js | v6 |
| Development | Hardhat | Latest |
| Frontend IDE | Remix IDE | Browser-based |
| Wallet | MetaMask | Browser Extension |

## 📊 Test Coverage

- ✅ Network Setup: PASSED
- ✅ Smart Contracts: Deployed & Tested
- ✅ Backend API: 19/19 endpoints tested
- ✅ Authentication: JWT + role-based access
- ✅ On-chain Permission: ClassManager whitelist
- ✅ On-chain Scoring: ScoreManager recorded
- ✅ Database: Auto-migration tested
- ⏳ Frontend: UI development pending

## 🚀 Next Steps

1. **Frontend Development** - Build teacher/student UI (React)
2. **MetaMask Integration** - Connect to custom RPC in UI
3. **Remix IDE Guide** - Document deployment workflow
4. **Student Wallet Export** - QR code + private key export
5. **Monitoring Dashboard** - Real-time blockchain monitoring

## 📞 Support & Contact

- **Repo:** [PhmVu/EBN-Besu](https://github.com/PhmVu/EBN-Besu)
- **Issues:** GitHub Issues
- **Documentation:** `/docs` folder

## 📄 License

MIT License - See [LICENSE](LICENSE) for details


## License

MIT
