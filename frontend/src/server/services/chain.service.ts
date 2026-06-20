import {
  createPublicClient,
  createWalletClient,
  type Hex,
  http,
  keccak256,
  pad,
  toHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "@/lib/viem";
import {
  ConsensusRegistryAbi,
  ContributionRegistryAbi,
  WorkspaceRegistryAbi,
} from "@/server/contracts/abi";
import {
  consensusRegistryAddress,
  contributionRegistryAddress,
  workspaceRegistryAddress,
} from "@/server/contracts/addresses";

// Helper: UUID to bytes32 (padded to 32 bytes)
export function uuidToBytes32(uuid: string): Hex {
  const cleanUuid = uuid.replace(/-/g, "");
  return pad(`0x${cleanUuid}`, { size: 32 });
}

// Helper: JSON content to keccak256 hash
export function hashContent(content: any): Hex {
  const str = typeof content === "string" ? content : JSON.stringify(content);
  return keccak256(toHex(str));
}

// Get Viem clients
function getClients() {
  const rpcUrl =
    process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC_URL ??
    "https://testnet-rpc.monad.xyz";
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

  if (!privateKey || !privateKey.startsWith("0x")) {
    console.warn(
      "[Chain Service] DEPLOYER_PRIVATE_KEY is missing or invalid. Using offline/mock mode.",
    );
    return null;
  }

  try {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(rpcUrl),
    });
    const walletClient = createWalletClient({
      chain: monadTestnet,
      transport: http(rpcUrl),
      account,
    });
    return { publicClient, walletClient, account };
  } catch (error) {
    console.error("[Chain Service] Failed to initialize clients:", error);
    return null;
  }
}

export async function onChainCreateWorkspace(
  workspaceId: string,
): Promise<string> {
  console.log(`[Chain Service] Creating workspace on-chain: ${workspaceId}`);
  const clients = getClients();
  const address = workspaceRegistryAddress;

  if (!clients || !address) {
    console.warn(
      "[Chain Service] Skipping on-chain write — mock tx hash returned.",
    );
    return "0x" + "0".repeat(64);
  }

  const { publicClient, walletClient, account } = clients;
  const bytes32Id = uuidToBytes32(workspaceId);

  const { request } = await publicClient.simulateContract({
    address: address as `0x${string}`,
    abi: WorkspaceRegistryAbi,
    functionName: "createWorkspace",
    args: [bytes32Id],
    account,
  });

  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

export async function onChainLogContribution(
  workspaceId: string,
  agentRole: string,
  content: any,
  score: number,
): Promise<string> {
  console.log(
    `[Chain Service] Logging contribution on-chain: ${workspaceId} (${agentRole}, score: ${score})`,
  );
  const clients = getClients();
  const address = contributionRegistryAddress;

  if (!clients || !address) {
    console.warn(
      "[Chain Service] Skipping on-chain write — mock tx hash returned.",
    );
    return "0x" + "0".repeat(64);
  }

  const { publicClient, walletClient, account } = clients;
  const bytes32Id = uuidToBytes32(workspaceId);
  const contentHash = hashContent(content);

  const { request } = await publicClient.simulateContract({
    address: address as `0x${string}`,
    abi: ContributionRegistryAbi,
    functionName: "logContribution",
    args: [bytes32Id, agentRole, contentHash, BigInt(score)],
    account,
  });

  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

export async function onChainFinalizeWorkspace(
  workspaceId: string,
  reportContent: any,
  finalScore: number,
): Promise<{ finalizeTxHash: string; consensusTxHash: string }> {
  console.log(
    `[Chain Service] Finalizing workspace on-chain: ${workspaceId} (score: ${finalScore})`,
  );
  const clients = getClients();
  const workspaceAddress = workspaceRegistryAddress;
  const consensusAddress = consensusRegistryAddress;

  if (!clients || !workspaceAddress || !consensusAddress) {
    console.warn(
      "[Chain Service] Skipping on-chain write — mock tx hashes returned.",
    );
    const dummyHash = "0x" + "0".repeat(64);
    return { finalizeTxHash: dummyHash, consensusTxHash: dummyHash };
  }

  const { publicClient, walletClient, account } = clients;
  const bytes32Id = uuidToBytes32(workspaceId);
  const reportHash = hashContent(reportContent);

  // 1. Finalize workspace
  const { request: finalizeReq } = await publicClient.simulateContract({
    address: workspaceAddress as `0x${string}`,
    abi: WorkspaceRegistryAbi,
    functionName: "finalizeWorkspace",
    args: [bytes32Id, reportHash],
    account,
  });
  const finalizeTxHash = await walletClient.writeContract(finalizeReq);
  await publicClient.waitForTransactionReceipt({ hash: finalizeTxHash });

  // 2. Record consensus score
  const { request: consensusReq } = await publicClient.simulateContract({
    address: consensusAddress as `0x${string}`,
    abi: ConsensusRegistryAbi,
    functionName: "recordConsensus",
    args: [bytes32Id, BigInt(finalScore)],
    account,
  });
  const consensusTxHash = await walletClient.writeContract(consensusReq);
  await publicClient.waitForTransactionReceipt({ hash: consensusTxHash });

  return { finalizeTxHash, consensusTxHash };
}
