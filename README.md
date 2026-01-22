# EBN-Besu

Hyperledger Besu private network with QBFT consensus mechanism.

## Network Configuration

- **Consensus**: QBFT (Quorum Byzantine Fault Tolerance)
- **Block Time**: 2 seconds
- **Chain ID**: 1337
- **Nodes**: 4 (3 validators + 1 RPC node)

## Network Topology

| Node | Type | RPC Port | P2P Port | IP Address |
|------|------|----------|----------|------------|
| validator1 | Validator | 8545 | 30303 | 172.20.0.10 |
| validator2 | Validator | 8547 | 30304 | 172.20.0.11 |
| validator3 | Validator | 8548 | 30305 | 172.20.0.12 |
| rpc-node | RPC Node | 8549 | 30306 | 172.20.0.13 |

## Prerequisites

- Docker & Docker Compose
- WSL2 (for Windows users)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/PhmVu/EBN-Besu.git
   cd EBN-Besu/besu-network
   ```

2. **Start the network**
   ```bash
   docker-compose up -d
   ```

3. **Check network status**
   ```bash
   # Check peer count
   curl -X POST --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' http://localhost:8545
   
   # Check block number
   curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545
   
   # Check validators
   curl -X POST --data '{"jsonrpc":"2.0","method":"qbft_getValidatorsByBlockNumber","params":["latest"],"id":1}' http://localhost:8545
   ```

4. **View logs**
   ```bash
   docker-compose logs -f
   ```

5. **Stop the network**
   ```bash
   docker-compose down
   ```

## Validators

The network has 4 pre-configured validators:

- **Validator 1**: `0x9a08b75b76d13bf9c45f5212fac126ddff4c5416`
- **Validator 2**: `0x12b1d0ee4d2a577065a5b95c7e8bfcf6c749c069`
- **Validator 3**: `0xb7b9a6365e53e63492728de15f52558d9d3bd3d8`
- **RPC Node**: `0xbfd9930d1c73cd55333dd73b1d1f53fe67675cf5`

## RPC Endpoints

- **HTTP RPC**: http://localhost:8545 (validator1)
- **WebSocket**: ws://localhost:8546 (validator1)
- **RPC Node**: http://localhost:8549

## Available RPC Methods

- `eth_*` - Ethereum JSON-RPC methods
- `net_*` - Network methods
- `web3_*` - Web3 methods
- `qbft_*` - QBFT consensus methods
- `admin_*` - Admin methods (validators only)
- `txpool_*` - Transaction pool methods

## Network Reset

To reset the network and start fresh:

```bash
docker-compose down
rm -rf besu-network/data/*/database besu-network/data/*/caches
docker-compose up -d
```

## Troubleshooting

### Nodes not connecting
- Check if all containers are running: `docker-compose ps`
- Check logs: `docker-compose logs -f`
- Verify network: `docker network ls`

### No blocks being produced
- Ensure at least 3 validators are running (QBFT requires 2f+1 nodes)
- Check validator logs for consensus messages

## License

MIT
