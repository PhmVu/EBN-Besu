# Smart Contracts for EBN-Besu Training Platform

This directory contains the Solidity smart contracts for the EBN-Besu Fintech Training Platform.

## Overview

The system consists of two main smart contracts:

1. **ClassManager** - Manages classes, teachers, and student whitelisting
2. **ScoreManager** - Manages student scores and assignment submissions

These contracts work together to provide a complete on-chain solution for managing educational classes and grading.

## Directory Structure

```
contracts/
├── interfaces/
│   └── IClassManager.sol      # Interface for ClassManager integration
├── ClassManager.sol            # Main class management contract
├── ScoreManager.sol            # Score and assignment management contract
├── scripts/
│   ├── deploy.js              # Deployment script
│   ├── load-deployment.js     # Helper to load deployment info
│   ├── extract-abi.js         # Extract ABI and addresses
│   ├── test-besu-network.js  # Test on Besu network
│   └── verify-contracts.js    # Verify contracts on blockchain
├── test/
│   ├── ClassManager.test.js   # Unit tests for ClassManager
│   ├── ScoreManager.test.js   # Unit tests for ScoreManager
│   └── Integration.test.js    # Integration tests
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Dependencies
└── .env.example              # Environment variables template
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Access to a Besu network (local or remote)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Compile contracts:**
   ```bash
   npm run compile
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

## Contracts

### ClassManager

Manages classes and student permissions.

**Key Functions:**
- `createClass(string classId)` - Create a new class
- `addStudent(string classId, address student)` - Add student to whitelist
- `removeStudent(string classId, address student)` - Remove student from whitelist
- `closeClass(string classId)` - Close a class (prevent new operations)
- `isStudentAllowed(string classId, address student)` - Check if student is allowed
- `getClassInfo(string classId)` - Get class information

**Events:**
- `ClassCreated` - Emitted when a class is created
- `StudentAdded` - Emitted when a student is added
- `StudentRemoved` - Emitted when a student is removed
- `ClassClosed` - Emitted when a class is closed
- `PermissionUpdated` - Emitted when student permission changes

### ScoreManager

Manages scores and assignment submissions. Integrates with ClassManager to verify student permissions.

**Key Functions:**
- `registerClass(string classId)` - Register a class (must exist in ClassManager)
- `submitAssignment(string classId, bytes32 assignmentHash)` - Submit assignment (students only)
- `recordScore(string classId, address student, uint256 score)` - Record score (teacher only)
- `getScore(string classId, address student)` - Get student score
- `getSubmission(string classId, address student)` - Get submission info
- `hasSubmitted(string classId, address student)` - Check if student has submitted

**Events:**
- `ClassRegistered` - Emitted when a class is registered
- `AssignmentSubmitted` - Emitted when an assignment is submitted
- `ScoreRecorded` - Emitted when a score is recorded

## Deployment

### Deploy to Besu Network

1. **Ensure Besu network is running:**
   ```bash
   cd ../besu-network
   ./scripts/start-network.sh
   ```

2. **Deploy contracts:**
   ```bash
   npm run deploy:besu
   ```

   Or use the improved deploy script:
   ```bash
   node scripts/deploy.js --network besu
   ```

3. **Extract ABI and addresses:**
   ```bash
   node scripts/extract-abi.js
   ```

   This creates `contracts.json` with contract addresses and ABIs for backend integration.

### Deployment Information

After deployment, information is saved to:
- `deployments/deployment-{timestamp}.json` - Full deployment details
- `contracts.json` - Simplified format for backend

## Testing

### Unit Tests

Run all unit tests:
```bash
npm test
```

Run specific test file:
```bash
npx hardhat test test/ClassManager.test.js
```

### Integration Tests

Test the interaction between contracts:
```bash
npx hardhat test test/Integration.test.js
```

### Network Tests

Test on actual Besu network:
```bash
node scripts/test-besu-network.js
```

## API Documentation

### ClassManager API

#### createClass
```solidity
function createClass(string memory classId) public
```
Creates a new class. The caller becomes the teacher.

**Parameters:**
- `classId`: Unique identifier for the class

**Events:**
- `ClassCreated(classId, teacher, timestamp)`

#### addStudent
```solidity
function addStudent(string memory classId, address student) public
```
Adds a student to the class whitelist. Only the class teacher can call this.

**Parameters:**
- `classId`: Class identifier
- `student`: Student wallet address

**Events:**
- `StudentAdded(classId, student, teacher)`
- `PermissionUpdated(classId, student, true, teacher)`

#### isStudentAllowed
```solidity
function isStudentAllowed(string memory classId, address student) public view returns (bool)
```
Checks if a student is allowed in a class. Returns false if:
- Class doesn't exist
- Class is closed
- Student is not in whitelist

**Returns:** `true` if student is allowed, `false` otherwise

### ScoreManager API

#### submitAssignment
```solidity
function submitAssignment(string memory classId, bytes32 assignmentHash) public
```
Submits an assignment. Only whitelisted students can submit.

**Parameters:**
- `classId`: Class identifier
- `assignmentHash`: Hash of the assignment (e.g., IPFS hash)

**Requirements:**
- Class must exist in ClassManager
- Student must be whitelisted in ClassManager
- Assignment hash must not be zero

**Events:**
- `AssignmentSubmitted(classId, student, assignmentHash, timestamp)`

#### recordScore
```solidity
function recordScore(string memory classId, address student, uint256 score) public
```
Records a score for a student. Only the teacher can call this.

**Parameters:**
- `classId`: Class identifier
- `student`: Student wallet address
- `score`: Score value (0-1000)

**Requirements:**
- Only teacher can call
- Class must exist
- Score must be <= 1000

**Events:**
- `ScoreRecorded(classId, student, score, teacher, timestamp)`

## Usage Examples

### Example 1: Create Class and Add Student

```javascript
const { ethers } = require("hardhat");

async function example() {
  const [teacher, student] = await ethers.getSigners();
  
  // Deploy ClassManager
  const ClassManager = await ethers.getContractFactory("ClassManager");
  const classManager = await ClassManager.deploy();
  
  // Create class
  await classManager.connect(teacher).createClass("CS101");
  
  // Add student
  await classManager.connect(teacher).addStudent("CS101", student.address);
  
  // Check permission
  const allowed = await classManager.isStudentAllowed("CS101", student.address);
  console.log("Student allowed:", allowed); // true
}
```

### Example 2: Submit Assignment and Record Score

```javascript
async function example2() {
  const [teacher, student] = await ethers.getSigners();
  
  // Deploy contracts
  const ClassManager = await ethers.getContractFactory("ClassManager");
  const classManager = await ClassManager.deploy();
  
  const ScoreManager = await ethers.getContractFactory("ScoreManager");
  const scoreManager = await ScoreManager.deploy(
    teacher.address,
    classManager.address
  );
  
  // Setup
  await classManager.connect(teacher).createClass("CS101");
  await classManager.connect(teacher).addStudent("CS101", student.address);
  await scoreManager.connect(teacher).registerClass("CS101");
  
  // Student submits assignment
  const assignmentHash = ethers.keccak256(ethers.toUtf8Bytes("assignment1"));
  await scoreManager.connect(student).submitAssignment("CS101", assignmentHash);
  
  // Teacher records score
  await scoreManager.connect(teacher).recordScore("CS101", student.address, 85);
  
  // Query score
  const [score, recordedAt, recordedBy] = await scoreManager.getScore(
    "CS101",
    student.address
  );
  console.log("Score:", score.toString()); // 85
}
```

## Integration with Backend

After deployment, use the generated `contracts.json` file in your backend:

```javascript
const contracts = require('./contracts.json');
const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider(process.env.BESU_RPC_URL);
const classManager = new ethers.Contract(
  contracts.ClassManager.address,
  contracts.ClassManager.abi,
  provider
);
```

## Troubleshooting

### Compilation Errors

If you get compilation errors:
1. Check Solidity version matches (0.8.19)
2. Ensure all dependencies are installed: `npm install`
3. Clear cache: `npx hardhat clean`

### Deployment Errors

If deployment fails:
1. Check Besu network is running
2. Verify RPC_URL in .env is correct
3. Ensure deployer account has sufficient balance
4. Check chain ID matches (1337)

### Test Failures

If tests fail:
1. Run `npx hardhat clean` and recompile
2. Check network configuration in hardhat.config.js
3. Verify all dependencies are up to date

## Security Considerations

- Private keys should never be committed to git
- Use `.env` file (already in .gitignore)
- Test thoroughly before deploying to production
- Review contract code for security vulnerabilities
- Consider using OpenZeppelin libraries for common patterns

## License

MIT
