# Deployment Guide

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL (or use Docker)
- Git

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd EBN-Besu
```

### 2. Start Besu Network

```bash
cd besu-network
docker-compose up -d
```

Wait for network to initialize (about 30 seconds), then verify:

```bash
./scripts/check-network.sh
```

### 3. Create Admin Account

```bash
./scripts/create-admin-account.sh
```

This will create `.env` file with admin credentials. Add the admin address to `genesis.json` if you want to pre-fund it.

### 4. Deploy Smart Contracts

```bash
cd ../contracts
npm install
cp .env.example .env
# Edit .env with your admin private key and RPC URL
npm run deploy:besu
```

Save the contract addresses returned.

### 5. Setup Database

```bash
# Install PostgreSQL (or use Docker)
# Create database
createdb besu_training

# Or using Docker:
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=besu_training \
  -p 5432:5432 \
  postgres:15
```

### 6. Setup Backend

```bash
cd ../backend
npm install
cp .env.example .env
# Edit .env with database credentials and contract addresses
npm run migrate
npm start
```

### 7. Setup Frontend

```bash
cd ../frontend
npm install
npm run dev
```

## Full Docker Deployment

Use `docker-compose.full.yml` for complete deployment:

```bash
docker-compose -f docker-compose.full.yml up -d
```

## Environment Variables

### Backend (.env)
```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=besu_training
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your_secret_key
RPC_URL=http://localhost:8549
ADMIN_PRIVATE_KEY=your_admin_private_key
CLASS_MANAGER_ADDRESS=0x...
SCORE_MANAGER_ADDRESS=0x...
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000/api
```

## Production Considerations

1. **Security:**
   - Change all default passwords
   - Use strong JWT secret
   - Enable HTTPS
   - Secure database access

2. **Performance:**
   - Use reverse proxy (nginx)
   - Enable database connection pooling
   - Configure CORS properly

3. **Monitoring:**
   - Setup logging
   - Monitor blockchain node health
   - Database backups

4. **Scaling:**
   - Use load balancer for backend
   - Database replication
   - CDN for frontend

## Troubleshooting

### Network not starting
- Check Docker is running
- Check ports are not in use
- Check logs: `docker-compose logs`

### Database connection errors
- Verify PostgreSQL is running
- Check credentials in .env
- Check network connectivity

### Contract deployment fails
- Verify Besu network is running
- Check admin account has balance
- Verify RPC URL is correct
