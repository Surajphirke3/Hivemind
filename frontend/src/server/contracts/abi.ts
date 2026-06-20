export const WorkspaceRegistryAbi = [
  {
    type: "function",
    name: "createWorkspace",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "finalizeWorkspace",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "reportHash", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "WorkspaceCreated",
    inputs: [
      { name: "id", type: "bytes32", indexed: true },
      { name: "creator", type: "address", indexed: true },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WorkspaceFinalized",
    inputs: [
      { name: "id", type: "bytes32", indexed: true },
      { name: "reportHash", type: "bytes32" },
    ],
    anonymous: false,
  },
] as const;

export const ContributionRegistryAbi = [
  {
    type: "function",
    name: "logContribution",
    inputs: [
      { name: "workspaceId", type: "bytes32" },
      { name: "agentRole", type: "string" },
      { name: "contentHash", type: "bytes32" },
      { name: "score", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "ContributionLogged",
    inputs: [
      { name: "workspaceId", type: "bytes32", indexed: true },
      { name: "agentRole", type: "string" },
      { name: "score", type: "uint256" },
    ],
    anonymous: false,
  },
] as const;

export const ConsensusRegistryAbi = [
  {
    type: "function",
    name: "recordConsensus",
    inputs: [
      { name: "workspaceId", type: "bytes32" },
      { name: "finalScore", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "ConsensusRecorded",
    inputs: [
      { name: "workspaceId", type: "bytes32", indexed: true },
      { name: "finalScore", type: "uint256" },
    ],
    anonymous: false,
  },
] as const;
