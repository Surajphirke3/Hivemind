#!/usr/bin/env bash
# Deploy HiveMind registries to Monad testnet
set -euo pipefail

# Find and load the frontend .env file if it exists
ENV_FILE="$(dirname "$0")/../../frontend/.env"
if [ -f "$ENV_FILE" ]; then
  echo "Loading environment variables from $ENV_FILE..."
  # Export variables from .env file, ignoring comments and blank lines
  export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)
fi

# Ensure DEPLOYER_PRIVATE_KEY is set
if [ -z "${DEPLOYER_PRIVATE_KEY:-}" ]; then
  echo "Error: DEPLOYER_PRIVATE_KEY is not defined in environment or $ENV_FILE."
  exit 1
fi

echo "Deploying WorkspaceRegistry..."
forge create src/WorkspaceRegistry.sol:WorkspaceRegistry \
  --rpc-url "${NEXT_PUBLIC_MONAD_TESTNET_RPC_URL:-https://testnet-rpc.monad.xyz}" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --broadcast

echo "Deploying ContributionRegistry..."
forge create src/ContributionRegistry.sol:ContributionRegistry \
  --rpc-url "${NEXT_PUBLIC_MONAD_TESTNET_RPC_URL:-https://testnet-rpc.monad.xyz}" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --broadcast

echo "Deploying ConsensusRegistry..."
forge create src/ConsensusRegistry.sol:ConsensusRegistry \
  --rpc-url "${NEXT_PUBLIC_MONAD_TESTNET_RPC_URL:-https://testnet-rpc.monad.xyz}" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --broadcast
