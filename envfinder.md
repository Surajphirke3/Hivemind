# Environment Variables Finder — HiveMind Protocol

This document provides a step-by-step guide on how to obtain every API key and environment variable required to run HiveMind Protocol.

---

## 1. AI API Keys

### GROQ_API_KEY
Used to power Llama 3.1 70B for fast reasoning across the Research, Market, Risk, Technical, and Critic agents.
1. Go to the [Groq Console](https://console.groq.com/).
2. Sign in or create an account.
3. In the sidebar, click on **API Keys**.
4. Click **Create API Key**, name it (e.g. `HiveMind`), and copy it.

### OPENAI_API_KEY
Used for GPT-4o, which synthesizes all agent reports into the final executive summary.
1. Go to the [OpenAI Platform](https://platform.openai.com/).
2. Log in or sign up.
3. Navigate to **API Keys** under the Dashboard settings.
4. Click **Create new secret key**, select permissions, and copy the key.

### OPENROUTER_API_KEY
Used as the automatic fallback via LiteLLM if Groq rate-limits during execution.
1. Go to [OpenRouter](https://openrouter.ai/).
2. Sign in with your wallet or email.
3. Click on your profile in the top-right and select **Keys**.
4. Click **Create Key**, name it, and copy it.

### LITELLM_CONFIG_PATH
Tells the LiteLLM proxy server where to read the routing configuration.
- Set this to the absolute or relative path of the config file in the workspace:
  `LITELLM_CONFIG_PATH=../litellm-config.yaml` (when run from the `frontend` folder) or `LITELLM_CONFIG_PATH=./litellm-config.yaml` (when run from root).

---

## 2. Supabase Environment Variables
Used for the database, user session records, and row-level security (RLS).

1. Sign in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project (or create a new one).
3. Click on the **Project Settings** (gear icon) in the bottom of the sidebar.
4. Select **API** under the Settings panel.
5. Retrieve the following:
   - **Project URL**: Copy the URL value and assign to `NEXT_PUBLIC_SUPABASE_URL`.
   - **Project API Keys**:
     - Copy the `anon` / `public` key and assign to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
     - Copy the `service_role` / `secret` key and assign to `SUPABASE_SERVICE_ROLE_KEY`.

---

## 3. Upstash Redis Environment Variables
Used for user wallet rate-limiting and pub/sub streaming queues.

1. Sign in to the [Upstash Console](https://console.upstash.com/).
2. Create a new **Redis** database.
3. Under the **REST API** section of your database details page, copy the following values:
   - **UPSTASH_REDIS_REST_URL**: The HTTP URL starting with `https://...`.
   - **UPSTASH_REDIS_REST_TOKEN**: The authorization token.

---

## 4. Blockchain & Web3 Setup (Monad Testnet)

### NEXT_PUBLIC_MONAD_TESTNET_RPC_URL
The RPC URL for interacting with Monad Testnet.
- Use the official default RPC: `https://testnet-rpc.monad.xyz`

### DEPLOYER_PRIVATE_KEY
The private key of the deployer wallet address that owns and interacts with the registry contracts.
1. Open your Web3 wallet (e.g. MetaMask, Rabby).
2. Select **Account Details** / **Export Private Key**.
3. Copy the private key hex string (ensure it is prefixed with `0x`).
4. **Warning**: Never share or commit this key to Git.

### Contract Addresses
After deploying the Solidity contracts via the deploy script:
`NEXT_PUBLIC_WORKSPACE_REGISTRY_ADDRESS`
`NEXT_PUBLIC_CONTRIBUTION_REGISTRY_ADDRESS`
`NEXT_PUBLIC_CONSENSUS_REGISTRY_ADDRESS`
- Assign these variables to the contract addresses output by the deploy script.

---

## 5. WalletConnect (RainbowKit Login)

### NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
Required by RainbowKit to manage wallet login connections.
1. Sign in to the [WalletConnect Developer Dashboard](https://cloud.walletconnect.com/).
2. Create a new project.
3. Copy the **Project ID** from the project dashboard.
