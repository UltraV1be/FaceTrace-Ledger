// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title FaceTraceVerification
 * @dev Tamper-evident verification registry for biometric search records.
 * Only cryptographic fingerprints (SHA-256 hashes) and audit metadata are stored on-chain.
 * Biometric embeddings, images, or personal identities are NEVER stored on-chain.
 */
contract FaceTraceVerification {
    
    struct VerificationRecord {
        bytes32 recordHash;
        uint256 timestamp;
        address submitter;
    }

    // Mapping from cryptographic fingerprint (recordHash) to on-chain record
    mapping(bytes32 => VerificationRecord) private records;

    // Total count of registered records
    uint256 public totalRecords;

    // Event emitted upon successful registration
    event RecordRegistered(
        bytes32 indexed recordHash,
        uint256 timestamp,
        address indexed submitter
    );

    /**
     * @notice Register a new verification record hash
     * @param recordHash The 32-byte SHA-256 hash of the canonical verification record
     */
    function registerRecord(bytes32 recordHash) external {
        require(recordHash != bytes32(0), "INVALID_HASH: Zero hash cannot be registered");
        require(records[recordHash].timestamp == 0, "DUPLICATE_RECORD: Hash already registered on-chain");

        records[recordHash] = VerificationRecord({
            recordHash: recordHash,
            timestamp: block.timestamp,
            submitter: msg.sender
        });

        totalRecords += 1;

        emit RecordRegistered(recordHash, block.timestamp, msg.sender);
    }

    /**
     * @notice Verify whether a record hash exists on-chain and retrieve its provenance
     * @param recordHash The 32-byte SHA-256 hash to verify
     * @return exists True if the record hash is registered, false otherwise
     * @return timestamp The unix epoch timestamp when the record was registered
     * @return submitter The Ethereum address that submitted the transaction
     */
    function verifyRecord(bytes32 recordHash) external view returns (
        bool exists,
        uint256 timestamp,
        address submitter
    ) {
        VerificationRecord memory rec = records[recordHash];
        if (rec.timestamp == 0) {
            return (false, 0, address(0));
        }
        return (true, rec.timestamp, rec.submitter);
    }
}
