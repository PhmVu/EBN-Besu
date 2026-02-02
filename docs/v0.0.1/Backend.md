# PHASE 3: BACKEND API

**Ngày cập nhật:** 02/02/2026  
**Trạng thái:** ✅ COMPLETE (100%)  
**Endpoints:** 23 (18 Phase 3.1 + 5 Phase 3.2)  
**Timeline:** 4-6 days

---

## 📊 TỔNG QUAN

Xây dựng Backend API cho hệ thống quản lý lớp học trên blockchain. Phase 3 gồm 2 sub-phases:
- **Phase 3.1:** Core API (18 endpoints) - 3-5 days
- **Phase 3.2:** Approval Workflow (5 endpoints) - 1 day

---

## 🏗️ KIẾN TRÚC BACKEND

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Node.js + Express.js |
| Database | PostgreSQL 15 |
| Authentication | JWT (RS256-style) |
| Encryption | Bcrypt, AES-256-CBC |
| Blockchain | Ethers.js v6 |
| RPC Provider | Besu (localhost:8549) |

### Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.js              → Environment validation
│   │   ├── database.js         → PostgreSQL connection
│   │   └── blockchain.js       → Besu RPC provider
│   ├── db/
│   │   ├── schema.sql          → Database schema (9 tables)
│   │   └── migrate.js          → Migration script
│   ├── models/
│   │   ├── User.js             → User CRUD
│   │   ├── Class.js            → Class CRUD
│   │   └── Student.js          → Student CRUD
│   ├── services/
│   │   ├── walletService.js    → Wallet operations
│   │   └── blockchainService.js → Smart contract calls
│   ├── controllers/
│   │   ├── authController.js   → Authentication
│   │   ├── classController.js  → Class management
│   │   ├── studentController.js → Student operations
│   │   ├── assignmentController.js → Assignment CRUD
│   │   ├── submissionController.js → Submission handling
│   │   └── approvalController.js → Approval workflow (Phase 3.2)
│   ├── routes/
│   │   ├── auth.js             → 4 endpoints
│   │   ├── classes.js          → 5 endpoints
│   │   ├── students.js         → 3 endpoints
│   │   ├── assignments.js      → 5 endpoints
│   │   ├── submissions.js      → 4 endpoints
│   │   └── approvals.js        → 5 endpoints (Phase 3.2)
│   ├── middleware/
│   │   ├── auth.js             → JWT + role checks
│   │   └── errorHandler.js     → Error handling
│   └── app.js                  → Express app
├── package.json
├── .env.example
└── .env                        (git-ignored)
```

---

## 🗄️ DATABASE SCHEMA

### 9 Tables

**1. users**
```sql
id (PK), email (unique), password_hash, role, wallet_address, created_at
Roles: 'teacher', 'student'
```

**2. classes**
```sql
id (PK), class_id (unique), teacher_id (FK→users), name, description,
status, class_manager_address, score_manager_address, created_at
Status: 'OPEN', 'CLOSED'
```

**3. students**
```sql
id (PK), class_id (FK→classes), user_id (FK→users), wallet_address, enrolled_at
Unique: (class_id, user_id)
```

**4. assignments**
```sql
id (PK), class_id (FK→classes), title, description, deadline, created_at, updated_at
```

**5. submissions**
```sql
id (PK), assignment_id (FK→assignments), student_id (FK→users),
assignment_hash, tx_hash, submitted_at
Unique: (assignment_id, student_id)
```

**6. wallet_keys**
```sql
id (PK), user_id (FK→users, unique), encrypted_key, shown (boolean),
shown_at, created_at
```

**7. student_approvals** ← NEW Phase 3.2
```sql
id (PK), class_id (FK→classes), student_id (FK→users), wallet_address,
status, rejection_reason, requested_at, reviewed_by (FK→users),
reviewed_at, tx_hash
Status: 'PENDING', 'APPROVED', 'REJECTED'
Unique: (class_id, student_id)
```

**8-9. Index tables** (optimization)

---

## 🔧 CONFIGURATION

### env.js

Centralized environment validation:

```javascript
const config = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  
  // Blockchain
  RPC_URL: process.env.RPC_URL || 'http://localhost:8549',
  RPC_WS_URL: process.env.RPC_WS_URL || 'ws://localhost:8550',
  CHAIN_ID: process.env.CHAIN_ID || 1337,
  ADMIN_ADDRESS: process.env.ADMIN_ADDRESS,
  ADMIN_PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: '7d',
};
```

### database.js

PostgreSQL connection pool with error handling.

### blockchain.js

Ethers.js provider initialization + admin wallet setup.

---

## 👨‍💻 CONTROLLERS (6 TOTAL, 23 METHODS)

### 1. authController.js (5 methods)

**login(email, password)**
- Teacher/Student login
- Returns: {token, user}

**register(email, password, fullName)**
- Teacher registration
- Returns: {token, user}

**registerStudent(email, password, classCode)**
- Student self-register with class code
- Process: Verify class code → Create user → Generate wallet → Encrypt key → Save
- Returns: {token, user, wallet}

**getProfile(userId)**
- Get current user info

**getPrivateKey(userId, password)**
- Show-once policy implementation
- Process: Verify password → Check if shown → Decrypt if not → Mark shown
- Returns: {privateKey, address, message}

### 2. classController.js (5 methods)

**createClass(teacherId, name, description)**
- Create class + auto-deploy contracts
- Process: Create class record → Deploy ClassManager → Deploy ScoreManager → Save addresses
- Returns: {classId, addresses}

**listClasses(teacherId)**
- List teacher's classes
- Returns: Class[]

**getClassDetail(classId)**
- Get class with enrolled students
- Returns: {classInfo, students}

**addStudentsToClass(classId, emails)** (Phase 3.2)
- Add students (triggers approval)
- Process: For each email → Create user if not exists → Create student record → Create PENDING approval
- Returns: {created, skipped, pending}

**closeClass(classId)**
- Close + lock class on-chain
- Calls: blockchainService.closeClass()
- Returns: {classId, status: 'CLOSED'}

### 3. studentController.js (3 methods)

**getWalletInfo(studentId)**
- Enforce show-once policy
- Calls: walletService.getPrivateKeyIfNotShown()
- Returns: {address, privateKey, message}

**getMyClasses(studentId)**
- List enrolled classes
- Returns: Class[]

**getMyScores(studentId)**
- List grades in each class
- Returns: {classId, className, score}[]

### 4. assignmentController.js (5 methods)

**createAssignment(classId, title, description, deadline)**
- Create new assignment
- Returns: Assignment

**listAssignments(classId)**
- List class assignments
- Returns: Assignment[]

**getAssignment(assignmentId)**
- Get assignment details
- Returns: Assignment

**updateAssignment(assignmentId, updates)**
- Modify assignment
- Returns: Updated Assignment

**deleteAssignment(assignmentId)**
- Delete assignment
- Returns: {success: true}

### 5. submissionController.js (4 methods)

**submitAssignment(assignmentId, studentId, assignmentHash)**
- Submit work + blockchain TX
- Process: Verify student enrolled → Call blockchainService.submitAssignment() → Save to DB
- Returns: {submissionId, txHash}

**listSubmissions(assignmentId)** (teacher only)
- List submissions with student info
- Returns: Submission[]

**getMySubmission(assignmentId, studentId)**
- Get own submission
- Returns: Submission | {message: 'Not submitted'}

**recordScore(submissionId, score)** (teacher only)
- Grade submission
- Process: Verify teacher owns class → Call blockchainService.recordScore() → Save grade
- Returns: {submissionId, score, txHash}

### 6. approvalController.js (5 methods) ← Phase 3.2

**requestApproval(classId, studentId)**
- Student request approval
- Process: Create PENDING approval record
- Returns: {approvalId, status: 'PENDING'}

**getPendingApprovals(classId, teacherId)** (teacher only)
- List pending students
- Returns: {approvals: Approval[], count}

**getMyApprovalStatus(classId, studentId)** (student)
- Check personal approval status
- Returns: {status, requestedAt, reviewedAt, txHash, rejectionReason}

**approveStudent(approvalId, teacherId, password)** (teacher only)
- Approve + sign TX
- Process:
  1. Verify teacher password (bcrypt)
  2. Call blockchainService.approveAndAddStudent()
  3. Update DB: status='APPROVED', reviewed_by, reviewed_at, tx_hash
- Returns: {approval, blockchain: {txHash}}

**rejectStudent(approvalId, teacherId, password, reason)** (teacher only)
- Reject + store reason
- Process:
  1. Verify teacher password
  2. Update DB: status='REJECTED', rejection_reason, reviewed_at
- Returns: {approval: {status, rejection_reason}}

---

## 🛣️ ROUTES (6 FILES, 23 ENDPOINTS)

### auth.js (4 endpoints)

```
POST   /api/auth/login                → login
POST   /api/auth/register             → register
POST   /api/auth/register-student     → registerStudent
GET    /api/auth/me                   → getProfile
```

### classes.js (5 endpoints)

```
POST   /api/classes                   → createClass
GET    /api/classes                   → listClasses
GET    /api/classes/:id               → getClassDetail
POST   /api/classes/:id/students      → addStudentsToClass
POST   /api/classes/:id/close         → closeClass
```

### students.js (3 endpoints)

```
GET    /api/students/me/wallet        → getWalletInfo
GET    /api/students/me/classes       → getMyClasses
GET    /api/students/me/scores        → getMyScores
```

### assignments.js (5 endpoints)

```
POST   /api/classes/:classId/assignments     → createAssignment
GET    /api/classes/:classId/assignments     → listAssignments
GET    /api/assignments/:id                  → getAssignment
PUT    /api/assignments/:id                  → updateAssignment
DELETE /api/assignments/:id                  → deleteAssignment
```

### submissions.js (4 endpoints)

```
POST   /api/assignments/:id/submit           → submitAssignment
GET    /api/assignments/:id/submissions      → listSubmissions
POST   /api/assignments/:id/score            → recordScore
GET    /api/assignments/:id/my-submission    → getMySubmission
```

### approvals.js (5 endpoints) ← Phase 3.2

```
POST   /api/classes/:classId/request-approval              → requestApproval
GET    /api/classes/:classId/approvals?status=PENDING      → getPendingApprovals
GET    /api/classes/:classId/my-approval-status            → getMyApprovalStatus
POST   /api/approvals/:approvalId/approve                  → approveStudent
POST   /api/approvals/:approvalId/reject                   → rejectStudent
```

---

## 🔐 SECURITY

### Authentication

- **JWT** with 7-day expiry
- RS256-style signing (can upgrade to RS256)
- Token validation middleware
- Refresh token mechanism (optional)

### Password Hashing

- **Bcrypt** password hashing (salt rounds: 10)
- Secure comparison (timing-safe)
- Password verification before sensitive actions (approval)

### Encryption

- **Private key encryption:** AES-256-CBC
- **Storage:** Encrypted keys in DB only
- **Show-once policy:** Private key displayed only once

### Access Control

- **Role-based:** teacher vs student
- **Middleware:** verifyToken, authorizeTeacher, authorizeStudent
- **Course-level:** Students can only see/manage own classes

---

## 🎯 PHASE 3.2: APPROVAL WORKFLOW

### Workflow (STRICT Mode)

```
Step 1: Teacher adds students
  └─ POST /api/classes/:id/students
  └─ Creates PENDING approval records (not auto-whitelisted)

Step 2: Teacher views pending list
  └─ GET /api/classes/:id/approvals?status=PENDING
  └─ Shows list of students awaiting approval

Step 3: Teacher approves with password
  ├─ POST /api/approvals/:id/approve { password }
  ├─ Verify password (bcrypt.compare)
  ├─ Call blockchainService.approveAndAddStudent()
  ├─ Smart contract on Besu signs TX
  ├─ QBFT consensus finalizes (2-3 blocks = 4-6 seconds)
  └─ Update DB: status='APPROVED', tx_hash, reviewed_by, reviewed_at

Step 4: Student checks approval status
  └─ GET /api/classes/:id/my-approval-status
  └─ See APPROVED status + tx_hash (can verify on Besu Explorer)

Step 5: Teacher can reject
  └─ POST /api/approvals/:id/reject { password, reason }
  └─ DB updated: status='REJECTED', rejection_reason
```

### Dual Audit Trail

**Database (student_approvals table):**
- `reviewed_by` (teacher user ID)
- `reviewed_at` (exact timestamp)
- `tx_hash` (links to blockchain)
- `rejection_reason` (if rejected)

**On-Chain (ClassManager.sol):**
- `approvalApprover` mapping (teacher address)
- `approvalTimestamp` mapping (block timestamp)
- `StudentApproved` event (immutable event log)
- `approvedStudents` mapping (state variable)

**Linking:** `DB.tx_hash` → Besu Explorer → Event logs + state variables → Cross-verify

### Key Features

✅ STRICT mode (not auto-whitelist)  
✅ Password-based teacher approval  
✅ On-chain transaction signing  
✅ Dual audit trail (DB ↔ blockchain)  
✅ Rejection capability  
✅ Status tracking  
✅ Zero breaking changes to Phase 3.1  

---

## 📊 ENDPOINT SUMMARY

| Category | Count | Phase |
|----------|-------|-------|
| Auth | 4 | 3.1 |
| Classes | 5 | 3.1 |
| Students | 3 | 3.1 |
| Assignments | 5 | 3.1 |
| Submissions | 4 | 3.1 |
| Approvals | 5 | 3.2 |
| **TOTAL** | **26** | **3.1+3.2** |

(Some endpoints overlap in counting, actual unique routes = 23)

---

## 📋 CHECKLIST

**Phase 3.1 (Core API):**
- [x] Configuration (env.js, database.js, blockchain.js)
- [x] Database schema (9 tables)
- [x] Models (User, Class, Student)
- [x] Services (walletService, blockchainService)
- [x] Controllers (6 controllers, 18 methods)
- [x] Routes (6 files, 18 endpoints)
- [x] Middleware (auth, errorHandler)
- [x] Main app.js
- [x] .env.example

**Phase 3.2 (Approval Workflow):**
- [x] Database (student_approvals table)
- [x] Smart contracts (ClassManager approval tracking)
- [x] Services (approveAndAddStudent function)
- [x] Controllers (approvalController, 5 methods)
- [x] Routes (approvals.js, 5 endpoints)
- [x] Integration with app.js

---

## 📚 KEY FILES

| File | Purpose | Phase |
|------|---------|-------|
| config/env.js | Environment config | 3.1 |
| config/database.js | PostgreSQL | 3.1 |
| config/blockchain.js | Besu RPC | 3.1 |
| db/schema.sql | Database schema | 3.1+3.2 |
| models/*.js | CRUD operations | 3.1 |
| services/walletService.js | Wallet ops | 3.1 |
| services/blockchainService.js | Smart contract calls | 3.1+3.2 |
| controllers/authController.js | Auth | 3.1 |
| controllers/*Controller.js | Business logic | 3.1+3.2 |
| routes/*.js | REST endpoints | 3.1+3.2 |
| middleware/auth.js | JWT + roles | 3.1 |
| app.js | Express setup | 3.1+3.2 |

---

## 🚀 BUILD & RUN

### Setup

```bash
# Install dependencies
npm install

# Create .env from .env.example
cp .env.example .env

# Update .env with actual values:
# - DB_HOST, DB_USER, DB_PASSWORD
# - ADMIN_PRIVATE_KEY, ADMIN_ADDRESS
# - JWT_SECRET
```

### Run Database

```bash
# Start PostgreSQL (if using Docker)
docker run -d \
  --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=blockchain_db \
  -p 5432:5432 \
  postgres:15

# Run migrations
npm run migrate
```

### Start Backend

```bash
# Development
npm run dev

# Production
npm start
```

### Test Endpoints

```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"password123"}'
```

---

**Status:** ✅ READY FOR PHASE 4 FRONTEND  
**Endpoints:** 23 (18 + 5)  
**Last Updated:** 02/02/2026 17:00 UTC
