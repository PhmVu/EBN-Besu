#!/bin/bash

# Script dừng Besu Network
# Usage: ./stop-network.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "Stopping Besu Network"
echo "=========================================="
echo ""

cd "$NETWORK_DIR"

# Check if network is running
if ! docker-compose ps | grep -q "Up"; then
    echo "Network is not running."
    exit 0
fi

echo "Stopping Besu network containers..."
docker-compose down

echo ""
echo "=========================================="
echo "Network stopped successfully!"
echo "=========================================="
echo ""
echo "Note: Blockchain data is preserved in ./data directory"
echo "To start again: ./start-network.sh"
