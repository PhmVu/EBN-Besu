# User Guide

## For Teachers

### Getting Started

1. **Register Account**
   - Go to login page
   - Click "Register as Teacher"
   - Fill in email, password, and full name
   - Click Register

2. **Create a Class**
   - After login, click "Create New Class"
   - Enter Class ID (e.g., CS101)
   - Enter Class Name
   - Add description (optional)
   - Click "Create Class"

3. **Add Students**
   - Open class details
   - Click "Add Students"
   - Enter student emails (one per line or comma-separated)
   - Students will receive wallet addresses automatically

4. **Close a Class**
   - When class ends, click "Close Class"
   - This prevents new submissions but keeps all data

### Managing Classes

- View all your classes on the dashboard
- Each class shows status (open/closed)
- View student list and their progress
- Check blockchain transactions

## For Students

### Getting Started

1. **Access Your Wallet**
   - Login to the system
   - Go to "My Wallet" tab
   - Copy your wallet address and private key
   - **Important:** Save your private key securely!

2. **Connect to Remix IDE**
   - Open Remix IDE (https://remix.ethereum.org)
   - Go to "Deploy & Run Transactions"
   - Select "Injected Provider" or "Web3 Provider"
   - Enter RPC URL: `http://localhost:8549`
   - Chain ID: `1337`
   - Import your private key to MetaMask or use directly

3. **Deploy Smart Contracts**
   - Write your Solidity code
   - Compile in Remix
   - Deploy using your wallet
   - Copy contract address for submission

4. **View Your Classes**
   - Go to "My Classes" tab
   - See all enrolled classes
   - Check class status

5. **View Your Scores**
   - Go to "My Scores" tab
   - See scores for all classes
   - Scores are recorded on blockchain

### Best Practices

- **Security:**
  - Never share your private key
  - Keep backups of your private key
  - Use different wallets for different purposes

- **Development:**
  - Test contracts locally first (Remix VM)
  - Check gas limits before deploying
  - Verify contract addresses

- **Submissions:**
  - Deploy contracts before deadline
  - Save transaction hashes
  - Verify deployment on blockchain

## RPC Endpoint Information

- **HTTP RPC:** http://localhost:8549
- **WebSocket:** ws://localhost:8550
- **Chain ID:** 1337
- **Currency Symbol:** ETH

## Troubleshooting

### Cannot connect to RPC
- Verify Besu network is running
- Check RPC URL is correct
- Check firewall settings

### Transaction fails
- Check account has balance (for gas)
- Verify network is synced
- Check contract address is correct

### Cannot see wallet
- Contact your teacher to be added to a class
- Verify you're logged in correctly
