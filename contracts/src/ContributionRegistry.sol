// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ContributionRegistry {
    struct Contribution {
        bytes32 workspaceId;
        string agentRole;
        bytes32 contentHash;
        uint256 score;
        uint256 timestamp;
    }

    mapping(bytes32 => Contribution[]) private _contributions;

    event ContributionLogged(bytes32 indexed workspaceId, string agentRole, uint256 score);

    function logContribution(
        bytes32 workspaceId,
        string calldata agentRole,
        bytes32 contentHash,
        uint256 score
    ) external {
        _contributions[workspaceId].push(Contribution({
            workspaceId: workspaceId,
            agentRole: agentRole,
            contentHash: contentHash,
            score: score,
            timestamp: block.timestamp
        }));
        emit ContributionLogged(workspaceId, agentRole, score);
    }

    function getContributions(bytes32 workspaceId) external view returns (Contribution[] memory) {
        return _contributions[workspaceId];
    }
}
