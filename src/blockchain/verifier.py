"""
Blockchain Verifier for FaceTrace Ledger.
Recomputes cryptographic fingerprint from local record and verifies against on-chain smart contract.
"""

from typing import Any, Dict
from web3.contract import Contract
from src.blockchain.client import BlockchainClient, _load_local_state
from src.crypto.hashing import hash_record, hex_to_bytes32
from src.utils.logger import logger, log_success, log_fail


class BlockchainVerifier:
    def __init__(self, client: BlockchainClient, contract: Contract | None = None):
        self.client = client
        self.contract = contract or client.contract
        if self.contract is None:
            self.contract = self.client.load_contract()

    def verify_discovered_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify a verification record against the immutable blockchain state.
        """
        hash_info = hash_record(record)
        local_hash = hash_info["hash"]
        raw_bytes32 = hex_to_bytes32(local_hash)

        try:
            exists, timestamp, submitter = self.contract.functions.verifyRecord(raw_bytes32).call()
            if exists:
                return {
                    "local_hash": local_hash,
                    "blockchain_exists": True,
                    "verified": True,
                    "timestamp": timestamp,
                    "submitter": submitter,
                    "status": "VERIFIED_ON_CHAIN"
                }
        except Exception as e:
            logger.debug(f"Direct contract call notice: {e}")

        # If in tester fallback mode, verify against state snapshot
        if self.client.is_tester:
            state = _load_local_state()
            saved_rec = state.get("records", {}).get(local_hash.lower())
            if saved_rec:
                return {
                    "local_hash": local_hash,
                    "blockchain_exists": True,
                    "verified": True,
                    "timestamp": saved_rec.get("timestamp", 0),
                    "submitter": saved_rec.get("submitter", self.client.get_account_address()),
                    "status": "VERIFIED_ON_CHAIN"
                }

        return {
            "local_hash": local_hash,
            "blockchain_exists": False,
            "verified": False,
            "timestamp": 0,
            "submitter": None,
            "reason": "HASH_MISMATCH_OR_UNREGISTERED",
            "status": "FAILED_NOT_FOUND"
        }
