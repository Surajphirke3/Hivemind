// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title HiveMindPlumbingCheck
/// @notice Phase 1 deploy smoke test — real registry logic lands in Phase 3.
contract HiveMindPlumbingCheck {
    event Ping(address indexed sender, uint256 timestamp);

    function ping() external {
        emit Ping(msg.sender, block.timestamp);
    }
}
