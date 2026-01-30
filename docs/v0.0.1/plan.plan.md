<!-- 766a235c-49c3-414c-9152-a4770361719d e2ff1498-bc61-421b-b2ce-e12525229f87 -->
# Kế hoạch xây dựng hệ thống mạng Besu cho đào tạo

## Tổng quan kiến trúc

Hệ thống được chia thành 3 tầng chính:

1. **Blockchain Infrastructure Layer** (Besu Network) - Đã có sẵn, cần kiểm tra và hoàn thiện
2. **Application Layer** (Backend + Frontend + Database) - Cần xây dựng mới
3. **Smart Contracts Layer** (Quản lý lớp học) - Cần phát triển

## Phase 1: Hoàn thiện Besu Network Infrastructure

### 1.1 Kiểm tra và cải thiện cấu hình Besu Network

**File cần kiểm tra/sửa:**

- `besu-network/docker-compose.yml` - Đảm bảo cấu hình đúng cho môi trường đào tạo
- `besu-network/config/genesis.json` - Kiểm tra cấu hình QBFT và pre-funded accounts

**Các task:**

- [ ] Kiểm tra RPC node có đủ APIs: ETH, NET, WEB3, TXPOOL, TRACE
- [ ] Đảm bảo RPC node expose đúng port (8549 cho HTTP, 8550 cho WebSocket)
- [ ] Kiểm tra genesis.json có đủ validators (3 validators + 1 RPC node)
- [ ] Tạo script kiểm tra health của network (`scripts/check-network.sh`)
- [ ] Tạo script khởi động/dừng network (`scripts/start-network.sh`, `scripts/stop-network.sh`)

### 1.2 Tạo Admin Account cho giáo viên

**File cần tạo:**

- `besu-network/scripts/create-admin-account.sh` - Script tạo admin account
- `besu-network/config/admin-account.json` - Lưu thông tin admin account (chỉ public key, không lưu private key)

**Các task:**

- [ ] Tạo script generate admin private key và address
- [ ] Fund admin account trong genesis.json (hoặc tạo script fund sau khi network start)
- [ ] Tạo file `.env.example` với ADMIN_ADDRESS (không commit private key)

## Phase 2: Xây dựng Smart Contracts ✅ **HOÀN THÀNH 100%**

**Test Results:** 63/63 tests pass  
**Status:** ✅ Complete - Ready for Phase 3

### 2.1 Smart Contract quản lý lớp học (ClassManager)

**File đã tạo:**

- ✅ `contracts/sol/ClassManager.sol` - Contract chính quản lý lớp học

**Chức năng đã có:**

- ✅ Quản lý danh sách lớp học (classId, teacher address, status)
- ✅ Whitelist sinh viên (mapping address => bool)
- ✅ Quản lý trạng thái lớp (OPEN, CLOSED)
- ✅ Events: `ClassCreated`, `StudentAdded`, `ClassClosed`, `PermissionUpdated`
- ✅ Hàm `addStudent(address student)` - Chỉ teacher gọi được
- ✅ Hàm `removeStudent(address student)` - Chỉ teacher gọi được
- ✅ Hàm `closeClass()` - Đóng lớp, chặn ghi mới
- ✅ Hàm `isStudentAllowed(address student)` - View function

### 2.2 Smart Contract quản lý điểm số (ScoreManager)

**File đã tạo:**

- ✅ `contracts/sol/ScoreManager.sol` - Contract quản lý điểm số và bài nộp
- ✅ `contracts/sol/interfaces/IClassManager.sol` - Interface tích hợp

**Chức năng đã có:**

- ✅ Lưu điểm số theo classId và student address
- ✅ Lưu hash của bài nộp (assignment hash)
- ✅ Events: `ScoreRecorded`, `AssignmentSubmitted`, `ClassRegistered`
- ✅ Hàm `submitAssignment(bytes32 assignmentHash)` - Sinh viên nộp bài
- ✅ Hàm `recordScore(address student, uint256 score)` - Teacher chấm điểm
- ✅ Hàm `getScore(address student)` - View function
- ✅ Tích hợp với ClassManager qua IClassManager interface

### 2.3 Setup môi trường phát triển Smart Contracts

**File đã tạo:**

- ✅ `contracts/package.json` - Dependencies cho Hardhat
- ✅ `contracts/hardhat.config.js` - Cấu hình Hardhat kết nối Besu
- ✅ `contracts/.env.example` - Template cho RPC URL và private keys

**Các task đã hoàn thành:**

- ✅ Setup Hardhat project
- ✅ Cấu hình network Besu trong hardhat.config.js
- ✅ Tạo scripts deploy contracts (`scripts/deploy.js`)
- ✅ Tạo tests cho contracts (`test/ClassManager.test.js`, `test/ScoreManager.test.js`, `test/Integration.test.js`)
- ✅ Tạo scripts hỗ trợ: `extract-abi.js`, `test-besu-network.js`, `setup-and-deploy.sh`

## Phase 3: Xây dựng Backend API

### 3.1 Cấu trúc Backend

**Thư mục cần tạo:**

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── blockchain.js
│   │   └── env.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Class.js
│   │   └── Student.js
│   ├── services/
│   │   ├── walletService.js
│   │   ├── blockchainService.js
│   │   └── classService.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── classController.js
│   │   └── studentController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── classes.js
│   │   └── students.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   └── app.js
├── package.json
└── .env.example
```

### 3.2 Database Schema (PostgreSQL/MongoDB)

**File cần tạo:**

- `backend/src/models/User.js` - Model cho Teacher/Student
- `backend/src/models/Class.js` - Model cho lớp học
- `backend/src/models/Student.js` - Model cho sinh viên trong lớp

**Schema cần có:**

- [ ] Users table: id, email, password_hash, role (teacher/student), wallet_address, created_at
- [ ] Classes table: id, class_id (unique), teacher_id, name, description, status, contract_address, created_at, closed_at
- [ ] Students table: id, class_id, user_id, wallet_address, private_key_encrypted (optional), enrolled_at
- [ ] Assignments table: id, class_id, title, description, deadline, created_at
- [ ] Submissions table: id, assignment_id, student_id, contract_address, transaction_hash, submitted_at

### 3.3 Wallet Service

**File cần tạo:**

- `backend/src/services/walletService.js`

**Chức năng:**

- [ ] `generateWallet()` - Tạo wallet mới cho sinh viên (dùng ethers.js)
- [ ] `encryptPrivateKey(privateKey, password)` - Mã hóa private key (không lưu plain text)
- [ ] `getWalletAddress(userId)` - Lấy địa chỉ ví từ database

### 3.4 Blockchain Service (Blockchain Adapter)

**File cần tạo:**

- `backend/src/services/blockchainService.js`

**Chức năng:**

- [ ] Kết nối với Besu RPC node (dùng ethers.js)
- [ ] `deployClassManager(adminWallet)` - Deploy ClassManager contract
- [ ] `addStudentToClass(contractAddress, studentAddress)` - Gọi hàm addStudent
- [ ] `closeClass(contractAddress)` - Gọi hàm closeClass
- [ ] `listenToEvents(contractAddress, eventName, callback)` - Lắng nghe events từ contract
- [ ] `getStudentScore(contractAddress, studentAddress)` - Query điểm số
- [ ] `getClassStatus(contractAddress)` - Query trạng thái lớp

### 3.5 API Endpoints

**File cần tạo:**

- `backend/src/routes/auth.js` - Authentication routes
- `backend/src/routes/classes.js` - Class management routes
- `backend/src/routes/students.js` - Student management routes

**Endpoints cần có:**

**Authentication:**

- [ ] `POST /api/auth/login` - Đăng nhập (teacher/student)
- [ ] `POST /api/auth/register` - Đăng ký (chỉ teacher)
- [ ] `GET /api/auth/me` - Lấy thông tin user hiện tại

**Classes (Teacher only):**

- [ ] `POST /api/classes` - Tạo lớp học mới
- [ ] `GET /api/classes` - Lấy danh sách lớp học
- [ ] `GET /api/classes/:id` - Lấy chi tiết lớp học
- [ ] `POST /api/classes/:id/close` - Đóng lớp học
- [ ] `POST /api/classes/:id/students` - Thêm sinh viên vào lớp (upload CSV hoặc manual)

**Students:**

- [ ] `GET /api/students/my-wallet` - Sinh viên lấy thông tin ví (private key - chỉ hiển thị 1 lần)
- [ ] `GET /api/students/my-classes` - Lấy danh sách lớp học của sinh viên
- [ ] `GET /api/students/my-scores` - Lấy điểm số của sinh viên

### 3.6 Setup Backend

**File cần tạo:**

- `backend/package.json` - Dependencies: express, ethers, pg/mongoose, bcrypt, jsonwebtoken
- `backend/.env.example` - Template cho environment variables
- `backend/src/app.js` - Express app setup
- `backend/src/config/database.js` - Database connection
- `backend/src/config/blockchain.js` - Blockchain connection config

## Phase 4: Xây dựng Frontend

### 4.1 Cấu trúc Frontend

**Thư mục cần tạo:**

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── teacher/
│   │   └── student/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── TeacherDashboard.jsx
│   │   ├── StudentDashboard.jsx
│   │   ├── ClassManagement.jsx
│   │   └── WalletInfo.jsx
│   ├── services/
│   │   ├── api.js
│   │   └── blockchain.js
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── vite.config.js (hoặc next.config.js)
```

### 4.2 Teacher Dashboard

**File cần tạo:**

- `frontend/src/pages/TeacherDashboard.jsx`
- `frontend/src/components/teacher/ClassList.jsx`
- `frontend/src/components/teacher/CreateClass.jsx`
- `frontend/src/components/teacher/AddStudents.jsx`

**Chức năng:**

- [ ] Hiển thị danh sách lớp học
- [ ] Tạo lớp học mới (form: tên lớp, mô tả)
- [ ] Thêm sinh viên vào lớp (upload CSV hoặc nhập thủ công)
- [ ] Xem danh sách sinh viên trong lớp
- [ ] Đóng lớp học
- [ ] Xem tiến độ deploy contract của sinh viên

### 4.3 Student Dashboard

**File cần tạo:**

- `frontend/src/pages/StudentDashboard.jsx`
- `frontend/src/components/student/WalletInfo.jsx`
- `frontend/src/components/student/MyClasses.jsx`
- `frontend/src/components/student/MyScores.jsx`

**Chức năng:**

- [ ] Xem thông tin ví (hiển thị private key 1 lần duy nhất với cảnh báo)
- [ ] Xem danh sách lớp học đã đăng ký
- [ ] Xem điểm số
- [ ] Xem RPC endpoint để kết nối Remix/VS Code

### 4.4 Setup Frontend

**File cần tạo:**

- `frontend/package.json` - Dependencies: react, react-router-dom, axios, ethers
- `frontend/src/services/api.js` - API client
- `frontend/src/services/blockchain.js` - Blockchain utilities (nếu cần)

## Phase 5: Tích hợp và Testing

### 5.1 Integration Testing

**File cần tạo:**

- `tests/integration/class-flow.test.js` - Test flow tạo lớp, thêm sinh viên, đóng lớp
- `tests/integration/student-flow.test.js` - Test flow sinh viên lấy ví, deploy contract

### 5.2 End-to-End Testing

**Các scenario cần test:**

- [ ] Teacher tạo lớp học → Contract được deploy → Sinh viên được thêm vào whitelist
- [ ] Sinh viên lấy ví → Import vào Metamask → Deploy contract trên Remix
- [ ] Sinh viên nộp bài → Event được emit → Frontend cập nhật trạng thái
- [ ] Teacher đóng lớp → Contract chặn ghi mới → Dữ liệu cũ vẫn giữ nguyên

### 5.3 Documentation

**File cần tạo:**

- `docs/API.md` - API documentation
- `docs/DEPLOYMENT.md` - Hướng dẫn deploy
- `docs/USER_GUIDE.md` - Hướng dẫn sử dụng cho teacher/student
- `docs/ARCHITECTURE.md` - Kiến trúc hệ thống chi tiết

## Phase 6: Deployment và DevOps

### 6.1 Docker Compose cho toàn bộ hệ thống

**File cần tạo:**

- `docker-compose.full.yml` - Bao gồm Besu network + Backend + Frontend + Database

### 6.2 Environment Configuration

**File cần tạo:**

- `.env.example` - Template cho tất cả environment variables
- `scripts/setup-env.sh` - Script setup môi trường

### 6.3 Monitoring và Logging

**Các task:**

- [ ] Setup logging cho Backend (Winston hoặc Pino)
- [ ] Setup health check endpoints
- [ ] Tạo dashboard monitoring (optional)

## Thứ tự thực hiện ưu tiên

1. **Phase 1** - Hoàn thiện Besu Network (1-2 ngày)
2. **Phase 2** - Smart Contracts (2-3 ngày)
3. **Phase 3** - Backend API (3-5 ngày)
4. **Phase 4** - Frontend (3-5 ngày)
5. **Phase 5** - Testing và tích hợp (2-3 ngày)
6. **Phase 6** - Deployment (1-2 ngày)

**Tổng thời gian ước tính: 12-20 ngày**

### To-dos

- [ ] Kiểm tra và cải thiện cấu hình Besu Network (docker-compose.yml, genesis.json, RPC endpoints)
- [ ] Tạo scripts kiểm tra health và quản lý network (check-network.sh, start-network.sh, stop-network.sh)
- [ ] Tạo admin account cho giáo viên và cấu hình funding trong genesis.json
- [x] Phát triển Smart Contract ClassManager.sol với các chức năng quản lý lớp học, whitelist sinh viên ✅
- [x] Phát triển Smart Contract ScoreManager.sol để quản lý điểm số và bài nộp ✅
- [x] Setup môi trường Hardhat và cấu hình kết nối với Besu network ✅
- [x] Tạo scripts deploy contracts và tests cho Smart Contracts ✅ (63/63 tests pass)
- [ ] Thiết kế và tạo database schema (Users, Classes, Students, Assignments, Submissions)
- [ ] Xây dựng Wallet Service để tạo và quản lý ví cho sinh viên (dùng ethers.js)
- [ ] Xây dựng Blockchain Service (Blockchain Adapter) để tương tác với Besu RPC và Smart Contracts
- [ ] Xây dựng REST API endpoints cho authentication, class management, và student management
- [ ] Setup Backend với Express, database connection, middleware, và error handling
- [ ] Xây dựng Teacher Dashboard với các chức năng: tạo lớp, thêm sinh viên, đóng lớp, xem tiến độ
- [ ] Xây dựng Student Dashboard với các chức năng: xem ví, xem lớp học, xem điểm số
- [ ] Setup Frontend với React, routing, API client, và authentication context
- [ ] Viết integration tests cho các flow chính: tạo lớp, thêm sinh viên, deploy contract, nộp bài
- [ ] Thực hiện end-to-end testing cho các scenario đầy đủ từ teacher đến student
- [ ] Viết documentation: API docs, deployment guide, user guide, architecture docs
- [ ] Tạo docker-compose.full.yml để chạy toàn bộ hệ thống (Besu + Backend + Frontend + Database)
- [ ] Setup logging, health checks, và monitoring cho hệ thống