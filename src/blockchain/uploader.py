"""
Blockchain Uploader for FaceTrace Ledger.
Registers SHA-256 cryptographic fingerprints to the Ethereum smart contract.
"""

from typing import Any, Dict
from web3.contract import Contract
from src.blockchain.client import BlockchainClient, _load_local_state, _save_local_state
from src.crypto.hashing import hex_to_bytes32
from src.utils.logger import logger, log_success
import time


class BlockchainUploader:
    def __init__(self, client: BlockchainClient, contract: Contract | None = None):
        self.client = client
        self.w3 = client.w3
        self.contract = contract or client.contract
        if self.contract is None:
            self.contract = self.client.load_contract()

    def upload_record_hash(self, sha256_hex: str) -> Dict[str, Any]:
        """
        Upload a 64-character SHA-256 hex string to the blockchain.
        """
        raw_bytes32 = hex_to_bytes32(sha256_hex)
        account_addr = self.client.get_account_address()

        print(f"  [BLOCKCHAIN] Preparing transaction")
        print(f"  [BLOCKCHAIN] Uploading record hash: {sha256_hex}")
        print(f"  [BLOCKCHAIN] Submitter Address: {account_addr}")

        if self.client.is_tester:
            tx_hash = self.contract.functions.registerRecord(raw_bytes32).transact({"from": account_addr})
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            tx_hash_hex = tx_hash.hex() if hasattr(tx_hash, "hex") else str(tx_hash)
            block_num = receipt.get("blockNumber", 1)

            # Persist record in local state snapshot
            state = _load_local_state()
            state["records"][sha256_hex.lower()] = {
                "timestamp": int(time.time()),
                "submitter": account_addr,
                "tx_hash": tx_hash_hex,
                "block_number": block_num
            }
            _save_local_state(state)
        else:
            nonce = self.w3.eth.get_transaction_count(account_addr)
            gas_price = self.w3.eth.gas_price

            tx = self.contract.functions.registerRecord(raw_bytes32).build_transaction({
                "from": account_addr,
                "nonce": nonce,
                "gas": 200000,
                "gasPrice": gas_price,
                "chainId": self.client.chain_id
            })

            signed_tx = self.client.account.sign_transaction(tx)
            raw_tx = getattr(signed_tx, "raw_transaction", None) or getattr(signed_tx, "rawTransaction", None)
            tx_hash = self.w3.eth.send_raw_transaction(raw_tx)
            tx_hash_hex = tx_hash.hex() if hasattr(tx_hash, "hex") else str(tx_hash)
            print(f"  [BLOCKCHAIN] Transaction submitted: {tx_hash_hex}")
            print(f"  [BLOCKCHAIN] Waiting for confirmation...")
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            block_num = receipt.get("blockNumber", 0)

        if receipt.get("status") != 1:
            raise RuntimeError(f"TRANSACTION_FAILED: Blockchain transaction reverted: {receipt}")

        log_success(f"Record successfully registered on-chain at block #{block_num}")

        return {
            "transaction_hash": tx_hash_hex,
            "block_number": block_num,
            "record_hash": sha256_hex.lower(),
            "submitter": account_addr,
            "status": "success"
        }
