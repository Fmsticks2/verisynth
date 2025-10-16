// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Governance
 * @dev Lightweight governance contract to create proposals and vote on them.
 *      One address, one vote per proposal. Designed for simple community voting
 *      and deep-linkable proposals.
 */
contract Governance is Ownable {
    uint256 public nextProposalId = 1;

    struct Proposal {
        uint256 id;
        string title;
        string description;
        string url; // Optional link for context or call-to-action
        address proposer;
        uint256 createdAt;
        uint256 forVotes;
        uint256 againstVotes;
        bool closed;
    }

    // proposalId => Proposal
    mapping(uint256 => Proposal) public proposals;

    // proposalId => voter => hasVoted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(
        uint256 indexed id,
        address indexed proposer,
        string title,
        string url
    );

    event VoteCast(
        uint256 indexed id,
        address indexed voter,
        bool support
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new proposal. Returns the proposal ID.
     */
    function createProposal(
        string memory title,
        string memory description,
        string memory url
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title required");

        uint256 id = nextProposalId;
        nextProposalId++;

        proposals[id] = Proposal({
            id: id,
            title: title,
            description: description,
            url: url,
            proposer: msg.sender,
            createdAt: block.timestamp,
            forVotes: 0,
            againstVotes: 0,
            closed: false
        });

        emit ProposalCreated(id, msg.sender, title, url);
        return id;
    }

    /**
     * @dev Cast a vote on a proposal. Each address can vote once.
     */
    function vote(uint256 id, bool support) external {
        Proposal storage p = proposals[id];
        require(p.id != 0, "Proposal not found");
        require(!p.closed, "Proposal closed");
        require(!hasVoted[id][msg.sender], "Already voted");

        hasVoted[id][msg.sender] = true;

        if (support) {
            p.forVotes += 1;
        } else {
            p.againstVotes += 1;
        }

        emit VoteCast(id, msg.sender, support);
    }

    /**
     * @dev Close a proposal. Only owner can close for now.
     */
    function close(uint256 id) external onlyOwner {
        Proposal storage p = proposals[id];
        require(p.id != 0, "Proposal not found");
        require(!p.closed, "Already closed");
        p.closed = true;
    }

    function getProposal(uint256 id) external view returns (Proposal memory) {
        require(id > 0 && id < nextProposalId, "Proposal not found");
        return proposals[id];
    }

    function getProposalCount() external view returns (uint256) {
        return nextProposalId - 1;
    }
}