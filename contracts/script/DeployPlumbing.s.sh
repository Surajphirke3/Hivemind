#!/usr/bin/env bash
# Deploy HiveMindPlumbingCheck to Monad testnet (requires Foundry + funded wallet)
set -euo pipefail

forge create src/HiveMindPlumbingCheck.sol:HiveMindPlumbingCheck \
  --rpc-url "${NEXT_PUBLIC_MONAD_TESTNET_RPC_URL:-https://testnet-rpc.monad.xyz}" \
  --private-key "$DEPLOYER_PRIVATE_KEY"
