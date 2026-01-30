#!/bin/bash

# Script khởi động Besu Network
# Usage: ./start-network.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "Starting Besu Network"
echo "=========================================="
echo ""

cd "$NETWORK_DIR"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if network is already running
if docker-compose ps | grep -q "Up"; then
    echo "Network is already running!"
    echo ""
    echo "To restart, run: ./stop-network.sh first"
    exit 0
fi

echo "Starting Besu network containers..."
docker-compose up -d

echo ""
echo "Waiting for nodes to initialize (30 seconds)..."
sleep 30

echo ""
echo "Checking network status..."
"$SCRIPT_DIR/check-network.sh"

echo ""
echo "=========================================="
echo "Network started successfully!"
echo "=========================================="
echo ""
echo "RPC Endpoint: http://localhost:8549"
echo "WebSocket: ws://localhost:8550"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop network: ./stop-network.sh"
