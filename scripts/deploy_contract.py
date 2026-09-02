"""
Deploy FaceTraceVerification Solidity contract to the configured Ethereum blockchain.
"""

import sys
import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src.blockchain.client import BlockchainClient
from src.config import config
from src.utils.logger import logger, log_success, log_header


def deploy_contract() -> str:
    log_header("FaceTrace Ledger", "Smart Contract Deployment")

    client = BlockchainClient()
    abi, bytecode = client.load_contract_artifact()

    if not bytecode:
        raise ValueError("Bytecode is empty in artifacts/FaceTraceVerification.json. Please compile first.")

    account_addr = client.get_account_address()
    print(f"[DEPLOY] Deployer account: {account_addr}")

    contract_factory = client.w3.eth.contract(abi=abi, bytecode=bytecode)

    if client.is_tester:
        tx_hash = contract_factory.constructor().transact({"from": account_addr})
        receipt = client.w3.eth.wait_for_transaction_receipt(tx_hash)
        contract_addr = receipt.contractAddress
    else:
        nonce = client.w3.eth.get_transaction_count(account_addr)
        gas_price = client.w3.eth.gas_price

        construct_tx = contract_factory.constructor().build_transaction({
            "from": account_addr,
            "nonce": nonce,
            "gas": 1500000,
            "gasPrice": gas_price,
            "chainId": client.chain_id
        })

        signed = client.account.sign_transaction(construct_tx)
        raw_tx = getattr(signed, "raw_transaction", None) or getattr(signed, "rawTransaction", None)
        tx_hash = client.w3.eth.send_raw_transaction(raw_tx)
        print(f"[DEPLOY] Deployment transaction sent: {tx_hash.hex() if hasattr(tx_hash, 'hex') else tx_hash}")
        print("[DEPLOY] Waiting for receipt...")
        receipt = client.w3.eth.wait_for_transaction_receipt(tx_hash)
        contract_addr = receipt.contractAddress

    log_success(f"Contract successfully deployed to: {contract_addr}")
    print(f"\n[NEXT STEPS] Add this to your .env file:")
    print(f"CONTRACT_ADDRESS={contract_addr}\n")

    # Update artifacts
    artifact_path = config.artifacts_dir / "FaceTraceVerification.json"
    with open(artifact_path, "r", encoding="utf-8") as f:
        art_data = json.load(f)
    art_data["deployedAddress"] = contract_addr
    with open(artifact_path, "w", encoding="utf-8") as f:
        json.dump(art_data, f, indent=2)

    return contract_addr


if __name__ == "__main__":
    deploy_contract()
