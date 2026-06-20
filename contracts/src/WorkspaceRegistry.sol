// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

error WorkspaceAlreadyExists();
error WorkspaceDoesNotExist();
error WorkspaceAlreadyFinalized();
error NotWorkspaceCreator();

contract WorkspaceRegistry {
    struct Workspace {
        address creator;
        bytes32 reportHash;
        bool exists;
        bool finalized;
    }

    mapping(bytes32 => Workspace) public workspaces;

    event WorkspaceCreated(bytes32 indexed id, address indexed creator);
    event WorkspaceFinalized(bytes32 indexed id, bytes32 reportHash);

    function createWorkspace(bytes32 id) external {
        if (workspaces[id].exists) revert WorkspaceAlreadyExists();
        workspaces[id] = Workspace({
            creator: msg.sender,
            reportHash: bytes32(0),
            exists: true,
            finalized: false
        });
        emit WorkspaceCreated(id, msg.sender);
    }

    function finalizeWorkspace(bytes32 id, bytes32 reportHash) external {
        Workspace storage ws = workspaces[id];
        if (!ws.exists) revert WorkspaceDoesNotExist();
        if (ws.finalized) revert WorkspaceAlreadyFinalized();
        if (ws.creator != msg.sender) revert NotWorkspaceCreator();

        ws.reportHash = reportHash;
        ws.finalized = true;

        emit WorkspaceFinalized(id, reportHash);
    }
}
