// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/WorkspaceRegistry.sol";
import "../src/ContributionRegistry.sol";
import "../src/ConsensusRegistry.sol";

contract HiveMindTest is Test {
    WorkspaceRegistry public workspaceRegistry;
    ContributionRegistry public contributionRegistry;
    ConsensusRegistry public consensusRegistry;

    bytes32 public workspaceId = keccak256("workspace_1");
    address public creator = address(0x123);
    address public nonCreator = address(0x456);

    function setUp() public {
        workspaceRegistry = new WorkspaceRegistry();
        contributionRegistry = new ContributionRegistry();
        consensusRegistry = new ConsensusRegistry();
    }

    function testWorkspaceCreation() public {
        vm.prank(creator);
        workspaceRegistry.createWorkspace(workspaceId);

        (address wsCreator, bytes32 reportHash, bool exists, bool finalized) = workspaceRegistry.workspaces(workspaceId);
        assertEq(wsCreator, creator);
        assertEq(reportHash, bytes32(0));
        assertTrue(exists);
        assertFalse(finalized);
    }

    function testFailDoubleCreation() public {
        vm.prank(creator);
        workspaceRegistry.createWorkspace(workspaceId);
        
        vm.prank(creator);
        workspaceRegistry.createWorkspace(workspaceId);
    }

    function testWorkspaceFinalization() public {
        vm.prank(creator);
        workspaceRegistry.createWorkspace(workspaceId);

        bytes32 reportHash = keccak256("report_1");
        vm.prank(creator);
        workspaceRegistry.finalizeWorkspace(workspaceId, reportHash);

        (, bytes32 wsReportHash, , bool finalized) = workspaceRegistry.workspaces(workspaceId);
        assertEq(wsReportHash, reportHash);
        assertTrue(finalized);
    }

    function testFailFinalizationByNonCreator() public {
        vm.prank(creator);
        workspaceRegistry.createWorkspace(workspaceId);

        bytes32 reportHash = keccak256("report_1");
        vm.prank(nonCreator); // Should revert
        workspaceRegistry.finalizeWorkspace(workspaceId, reportHash);
    }

    function testContributionLogging() public {
        bytes32 contentHash = keccak256("content_1");
        contributionRegistry.logContribution(workspaceId, "research", contentHash, 85);

        ContributionRegistry.Contribution[] memory contribs = contributionRegistry.getContributions(workspaceId);
        assertEq(contribs.length, 1);
        assertEq(contribs[0].workspaceId, workspaceId);
        assertEq(keccak256(bytes(contribs[0].agentRole)), keccak256(bytes("research")));
        assertEq(contribs[0].contentHash, contentHash);
        assertEq(contribs[0].score, 85);
    }

    function testConsensusRecording() public {
        consensusRegistry.recordConsensus(workspaceId, 92);
        assertEq(consensusRegistry.consensusScores(workspaceId), 92);
    }
}
