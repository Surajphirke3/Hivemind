// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ConsensusRegistry {
    mapping(bytes32 => uint256) public consensusScores;

    event ConsensusRecorded(bytes32 indexed workspaceId, uint256 finalScore);

    function recordConsensus(bytes32 workspaceId, uint256 finalScore) external {
        consensusScores[workspaceId] = finalScore;
        emit ConsensusRecorded(workspaceId, finalScore);
    }
}
