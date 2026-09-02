"""
Blockchain Client for FaceTrace Ledger.
Handles Web3 connection, account credentials, and contract interface loading.
Maintains stateful Py-EVM tester with disk snapshotting to persist local blockchain state across CLI calls.
"""

import json
from pathlib import Path
from typing import Any, Optional, Tuple, Dict
from web3 import Web3
from web3.contract import Contract
from eth_account import Account
from src.config import config
from src.utils.logger import logger

STATE_FILE = config.artifacts_dir / "local_chain_state.json"
_GLOBAL_TESTER_PROVIDER = None


def _load_local_state() -> Dict[str, Any]:
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"records": {}, "deployed_address": None}


def _save_local_state(state: Dict[str, Any]) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)


class BlockchainConnectionError(Exception):
    """Exception raised when connection to Ethereum RPC fails."""
    pass


class BlockchainClient:
    def __init__(
        self,
        rpc_url: Optional[str] = None,
        chain_id: Optional[int] = None,
        private_key: Optional[str] = None,
        contract_address: Optional[str] = None,
        use_tester_fallback: bool = True
    ):
        self.rpc_url = (rpc_url or config.blockchain_rpc_url).strip()
        self.chain_id = chain_id or config.blockchain_chain_id
        self.private_key = (private_key or config.blockchain_private_key).strip()
        self.contract_address = (contract_address or config.contract_address).strip()
        self.use_tester_fallback = use_tester_fallback

        # Check artifacts for deployed address if not set
        if not self.contract_address:
            art_file = config.artifacts_dir / "FaceTraceVerification.json"
            if art_file.exists():
                try:
                    with open(art_file, "r", encoding="utf-8") as f:
                        art = json.load(f)
                    if art.get("deployedAddress"):
                        self.contract_address = art["deployedAddress"]
                except Exception:
                    pass

        self.w3: Optional[Web3] = None
        self.account: Optional[Any] = None
        self.contract: Optional[Contract] = None
        self.is_tester: bool = False

        self.connect()

    def connect(self) -> Web3:
        """Connect to Ethereum RPC node or fallback to PyEVM/EthTester."""
        global _GLOBAL_TESTER_PROVIDER

        # Try connecting to external RPC (Ganache / Hardhat / Anvil)
        try:
            w3_candidate = Web3(Web3.HTTPProvider(self.rpc_url, request_kwargs={"timeout": 1}))
            if w3_candidate.is_connected():
                self.w3 = w3_candidate
                self.is_tester = False
                print(f"  [BLOCKCHAIN] Connected to RPC endpoint: {self.rpc_url}")
                self._setup_account()
                return self.w3
        except Exception as e:
            logger.debug(f"Could not connect to RPC at {self.rpc_url}: {e}")

        if self.use_tester_fallback:
            try:
                if _GLOBAL_TESTER_PROVIDER is None:
                    from eth_tester import EthereumTester, PyEVMBackend
                    from web3.providers.eth_tester import EthereumTesterProvider

                    tester_backend = PyEVMBackend()
                    tester = EthereumTester(backend=tester_backend)
                    _GLOBAL_TESTER_PROVIDER = EthereumTesterProvider(tester)

                self.w3 = Web3(_GLOBAL_TESTER_PROVIDER)
                self.is_tester = True
                print("  [BLOCKCHAIN] Connected to local Ethereum node (Deterministic Py-EVM Engine)")
                self._setup_account()
                return self.w3
            except Exception as e:
                raise BlockchainConnectionError(f"Failed to initialize local Ethereum provider: {e}")

        raise BlockchainConnectionError(
            f"BLOCKCHAIN_CONNECTION_FAILED: Cannot connect to Ethereum RPC at {self.rpc_url}.\n"
            "Please start Ganache, Hardhat, or Anvil, or ensure your local node is running."
        )

    def _setup_account(self) -> None:
        """Initialize account from private key or test accounts."""
        if self.is_tester:
            accounts = self.w3.eth.accounts
            if accounts:
                self.account = accounts[0]
                return

        if self.private_key:
            try:
                pk = self.private_key if self.private_key.startswith("0x") else f"0x{self.private_key}"
                self.account = Account.from_key(pk)
            except Exception as e:
                raise ValueError(f"Invalid BLOCKCHAIN_PRIVATE_KEY: {e}")
        else:
            accounts = self.w3.eth.accounts
            if accounts:
                self.account = accounts[0]
            else:
                raise ValueError("No Ethereum account or private key configured.")

    def get_account_address(self) -> str:
        """Return the checksum Ethereum address of the active account."""
        if isinstance(self.account, str):
            return Web3.to_checksum_address(self.account)
        elif hasattr(self.account, "address"):
            return Web3.to_checksum_address(self.account.address)
        raise ValueError("No account loaded.")

    def load_contract_artifact(self) -> Tuple[list, str]:
        """Load ABI and bytecode from artifacts."""
        artifact_path = config.artifacts_dir / "FaceTraceVerification.json"
        if not artifact_path.exists():
            from scripts.compile_contract import compile_contract
            compile_contract()

        with open(artifact_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        return data["abi"], data.get("bytecode", "")

    def ensure_contract_deployed(self) -> Contract:
        """Deploy or load contract on active chain."""
        local_state = _load_local_state()

        if self.contract_address:
            try:
                return self.load_contract(self.contract_address)
            except Exception:
                pass

        if self.is_tester and local_state.get("deployed_address"):
            try:
                addr = local_state["deployed_address"]
                abi, _ = self.load_contract_artifact()
                self.contract_address = addr
                self.contract = self.w3.eth.contract(address=Web3.to_checksum_address(addr), abi=abi)
                return self.contract
            except Exception:
                pass

        # Deploy fresh
        abi, bytecode = self.load_contract_artifact()
        account_addr = self.get_account_address()
        contract_factory = self.w3.eth.contract(abi=abi, bytecode=bytecode)

        if self.is_tester:
            tx_hash = contract_factory.constructor().transact({"from": account_addr})
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            contract_addr = receipt.contractAddress
        else:
            nonce = self.w3.eth.get_transaction_count(account_addr)
            gas_price = self.w3.eth.gas_price
            construct_tx = contract_factory.constructor().build_transaction({
                "from": account_addr,
                "nonce": nonce,
                "gas": 1500000,
                "gasPrice": gas_price,
                "chainId": self.chain_id
            })
            signed = self.account.sign_transaction(construct_tx)
            raw_tx = getattr(signed, "raw_transaction", None) or getattr(signed, "rawTransaction", None)
            tx_hash = self.w3.eth.send_raw_transaction(raw_tx)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            contract_addr = receipt.contractAddress

        self.contract_address = contract_addr
        self.contract = self.w3.eth.contract(address=Web3.to_checksum_address(contract_addr), abi=abi)

        local_state["deployed_address"] = contract_addr
        _save_local_state(local_state)
        return self.contract

    def load_contract(self, address: Optional[str] = None) -> Contract:
        """Load contract instance at specified or configured address."""
        target_addr = (address or self.contract_address).strip()
        if not target_addr:
            return self.ensure_contract_deployed()

        abi, _ = self.load_contract_artifact()
        checksum_addr = Web3.to_checksum_address(target_addr)
        self.contract = self.w3.eth.contract(address=checksum_addr, abi=abi)
        return self.contract
