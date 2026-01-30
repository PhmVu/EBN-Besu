# System Architecture

## Overview

The Besu Training System is a blockchain-based educational platform built on Hyperledger Besu. It enables teachers to manage classes and students to deploy and interact with smart contracts on a real blockchain network.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Layer                               │
│  ┌──────────────┐              ┌──────────────┐            │
│  │   Teacher    │              │   Student    │            │
│  └──────┬───────┘              └──────┬───────┘            │
└─────────┼──────────────────────────────┼───────────────────┘
          │                              │
          │                              │
┌─────────▼──────────────────────────────▼───────────────────┐
│              Application Layer                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Frontend (React)                        │  │
│  │  - Teacher Dashboard                                │  │
│  │  - Student Dashboard                                │  │
│  │  - Authentication                                   │  │
│  └──────────────────┬──────────────────────────────────┘  │
│                     │                                       │
│  ┌──────────────────▼──────────────────────────────────┐  │
│  │              Backend API (Express)                  │  │
│  │  - REST API                                        │  │
│  │  - Authentication (JWT)                            │  │
│  │  - Business Logic                                  │  │
│  └──────┬──────────────────────────┬──────────────────┘  │
│         │                          │                       │
│  ┌──────▼──────┐          ┌───────▼────────┐             │
│  │  PostgreSQL │          │ Blockchain     │             │
│  │  Database   │          │ Service        │             │
│  │             │          │ (Ethers.js)    │             │
│  └─────────────┘          └───────┬────────┘             │
└───────────────────────────────────┼───────────────────────┘
                                     │
┌─────────────────────────────────────▼───────────────────────┐
│           Blockchain Infrastructure Layer                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Hyperledger Besu Network                     │   │
│  │                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │   │
│  │  │ Validator 1  │  │ Validator 2  │  │ Validator 3│ │   │
│  │  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │   │
│  │         │                  │                 │         │   │
│  │         └──────────────────┼─────────────────┘         │   │
│  │                            │                           │   │
│  │                    ┌───────▼────────┐                  │   │
│  │                    │   RPC Node     │                  │   │
│  │                    │  (Port 8549)   │                  │   │
│  │                    └────────────────┘                  │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Smart Contracts (On-chain)                    │   │
│  │  - ClassManager.sol                                   │   │
│  │  - ScoreManager.sol                                   │   │
│  └───────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

## Components

### 1. Frontend (React + Vite)

**Location:** `frontend/`

**Technologies:**
- React 18
- React Router
- Axios for API calls
- Ethers.js for blockchain interaction (if needed)

**Key Features:**
- Teacher dashboard for class management
- Student dashboard for wallet and scores
- Authentication UI
- Responsive design

### 2. Backend API (Node.js + Express)

**Location:** `backend/`

**Technologies:**
- Express.js
- PostgreSQL
- JWT for authentication
- Ethers.js for blockchain interaction
- Bcrypt for password hashing

**Key Features:**
- RESTful API
- User authentication and authorization
- Class management
- Student management
- Blockchain integration

**API Structure:**
```
/api/auth          - Authentication endpoints
/api/classes       - Class management (teacher only)
/api/students      - Student endpoints
```

### 3. Smart Contracts (Solidity)

**Location:** `contracts/`

**Contracts:**
- **ClassManager.sol:** Manages classes, student whitelist, class status
- **ScoreManager.sol:** Manages scores and assignment submissions

**Development:**
- Hardhat for compilation and testing
- Deploy scripts for Besu network
- Comprehensive test suite

### 4. Blockchain Infrastructure (Hyperledger Besu)

**Location:** `besu-network/`

**Configuration:**
- 3 Validator nodes (QBFT consensus)
- 1 RPC node (for external access)
- Docker Compose setup
- Genesis configuration

**Network Details:**
- Chain ID: 1337
- Block Time: 2 seconds
- Consensus: QBFT
- RPC Port: 8549
- WebSocket Port: 8550

## Data Flow

### Teacher Creates Class

1. Teacher submits form via Frontend
2. Frontend sends POST to `/api/classes`
3. Backend creates class in database
4. Backend calls `ClassManager.createClass()` on blockchain
5. Transaction is mined
6. Response sent back to Frontend

### Student Gets Wallet

1. Teacher adds student to class
2. Backend generates wallet using `WalletService`
3. Wallet info stored in database (encrypted)
4. Student logs in and views wallet
5. Private key shown once (with warning)

### Student Deploys Contract

1. Student uses Remix IDE
2. Connects to RPC endpoint (http://localhost:8549)
3. Imports private key to MetaMask
4. Deploys contract
5. Contract address saved
6. Student submits assignment with contract address

### Teacher Records Score

1. Teacher views student submissions
2. Teacher enters score
3. Backend calls `ScoreManager.recordScore()`
4. Score recorded on blockchain
5. Student can view score on dashboard

## Security Considerations

1. **Private Keys:**
   - Never stored in plain text
   - Encrypted in database
   - Shown only once to student
   - Student responsible for backup

2. **Authentication:**
   - JWT tokens with expiration
   - Password hashing with bcrypt
   - Role-based access control

3. **Blockchain:**
   - Private network (not public)
   - Permissioned validators
   - RPC access controlled

4. **API Security:**
   - Input validation
   - SQL injection prevention
   - CORS configuration
   - Error handling

## Scalability

### Current Limitations

- Single backend instance
- Single database
- Fixed number of validators

### Future Improvements

- Load balancing for backend
- Database replication
- Multiple RPC nodes
- Caching layer
- CDN for frontend

## Monitoring

### Health Checks

- Backend: `GET /health`
- Database: Connection pool monitoring
- Blockchain: RPC endpoint checks

### Logging

- Backend logs to console
- Database query logging
- Blockchain transaction logs

### Metrics

- API response times
- Database query performance
- Blockchain block production rate

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Development

### Local Development

1. Start Besu network: `cd besu-network && docker-compose up -d`
2. Deploy contracts: `cd contracts && npm run deploy:besu`
3. Start backend: `cd backend && npm run dev`
4. Start frontend: `cd frontend && npm run dev`

### Testing

- Smart contracts: `cd contracts && npm test`
- Backend: `cd backend && npm test`
- Integration: Manual testing through UI
