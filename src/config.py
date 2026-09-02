"""
Configuration Manager for FaceTrace Ledger.
Loads settings from environment variables and .env file.
"""

import os
from pathlib import Path
from dataclasses import dataclass
from dotenv import load_dotenv

# Load environment variables from .env if present
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")


@dataclass
class AppConfig:
    # Root Paths
    root_dir: Path = ROOT_DIR
    data_dir: Path = ROOT_DIR / "data"
    input_dir: Path = ROOT_DIR / "data" / "input"
    candidates_dir: Path = ROOT_DIR / "data" / "candidates"
    results_dir: Path = ROOT_DIR / "data" / "results"
    contracts_dir: Path = ROOT_DIR / "contracts"
    artifacts_dir: Path = ROOT_DIR / "artifacts"

    # Face Recognition
    face_match_threshold: float = float(os.getenv("FACE_MATCH_THRESHOLD", "0.65"))

    # Reverse Image Search
    reverse_search_provider: str = os.getenv("REVERSE_SEARCH_PROVIDER", "serpapi_lens").strip().lower()
    search_api_key: str = os.getenv("SEARCH_API_KEY", "").strip()

    # Blockchain
    blockchain_rpc_url: str = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545").strip()
    blockchain_chain_id: int = int(os.getenv("BLOCKCHAIN_CHAIN_ID", "1337"))
    blockchain_private_key: str = os.getenv("BLOCKCHAIN_PRIVATE_KEY", "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d").strip()
    contract_address: str = os.getenv("CONTRACT_ADDRESS", "").strip()

    # Logging
    log_level: str = os.getenv("LOG_LEVEL", "INFO").strip().upper()

    def __post_init__(self):
        # Ensure directories exist
        self.input_dir.mkdir(parents=True, exist_ok=True)
        self.candidates_dir.mkdir(parents=True, exist_ok=True)
        self.results_dir.mkdir(parents=True, exist_ok=True)
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)


config = AppConfig()
