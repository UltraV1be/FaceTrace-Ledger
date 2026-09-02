"""
Tests for Blockchain Client, Uploader, Verifier, and Smart Contract.
"""

import pytest
from src.blockchain.client import BlockchainClient
from src.blockchain.uploader import BlockchainUploader
from src.blockchain.verifier import BlockchainVerifier
from src.record.metadata_builder import build_verification_record
from src.crypto.hashing import hash_record, hex_to_bytes32


@pytest.fixture(scope="module")
def deployed_env():
    """Deploy contract to local test blockchain and return client + contract."""
    client = BlockchainClient(use_tester_fallback=True)
    abi, bytecode = client.load_contract_artifact()
    account_addr = client.get_account_address()

    contract_factory = client.w3.eth.contract(abi=abi, bytecode=bytecode)
    tx_hash = contract_factory.constructor().transact({"from": account_addr})
    receipt = client.w3.eth.wait_for_transaction_receipt(tx_hash)
    contract_addr = receipt.contractAddress

    contract = client.load_contract(contract_addr)
    return client, contract


def test_blockchain_register_and_verify(deployed_env):
    client, contract = deployed_env
    uploader = BlockchainUploader(client, contract)
    verifier = BlockchainVerifier(client, contract)

    record = build_verification_record(
        source_url="https://test.example.org/profile_alice.html",
        source_domain="test.example.org",
        result_title="Alice Profile",
        image_sha256="1111111111111111111111111111111111111111111111111111111111111111",
        similarity_score=0.912,
        search_provider="serpapi_lens"
    )

    hash_info = hash_record(record)
    rec_hash = hash_info["hash"]

    # 1. Register on-chain
    upload_res = uploader.upload_record_hash(rec_hash)
    assert upload_res["status"] == "success"
    assert upload_res["record_hash"] == rec_hash

    # 2. Verify on-chain
    verify_res = verifier.verify_discovered_record(record)
    assert verify_res["verified"] is True
    assert verify_res["blockchain_exists"] is True
    assert verify_res["timestamp"] > 0
    assert verify_res["submitter"] == client.get_account_address()


def test_blockchain_tamper_detection(deployed_env):
    client, contract = deployed_env
    verifier = BlockchainVerifier(client, contract)

    tampered_record = build_verification_record(
        source_url="https://tampered.example.org/fake.html",
        source_domain="tampered.example.org",
        result_title="Fake",
        image_sha256="2222222222222222222222222222222222222222222222222222222222222222",
        similarity_score=0.99,
        search_provider="serpapi_lens"
    )

    verify_res = verifier.verify_discovered_record(tampered_record)
    assert verify_res["verified"] is False
    assert verify_res["blockchain_exists"] is False
    assert verify_res["reason"] == "HASH_MISMATCH_OR_UNREGISTERED"


def test_blockchain_duplicate_registration_rejection(deployed_env):
    client, contract = deployed_env
    uploader = BlockchainUploader(client, contract)

    rec_hash = "3333333333333333333333333333333333333333333333333333333333333333"

    # First registration succeeds
    uploader.upload_record_hash(rec_hash)

    # Second registration must fail / revert
    with pytest.raises(Exception):
        uploader.upload_record_hash(rec_hash)
