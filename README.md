# 👁️‍🗨️ FaceTrace Ledger
### *AI Biometric Discovery, Social Media Provenance & Immutable Blockchain Verification Lab*

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.14-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18%20(Vite%20%2B%20TS)-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org)
[![Web3.py](https://img.shields.io/badge/Web3.py-v6-F16822?style=for-the-badge&logo=ethereum&logoColor=white)](https://web3py.readthedocs.io)
[![Tests](https://img.shields.io/badge/Tests-47%20Passed%20(100%25)-00E599?style=for-the-badge&logo=pytest&logoColor=white)](https://pytest.org)
[![License](https://img.shields.io/badge/License-MIT-F50064?style=for-the-badge)](LICENSE)

---

## 📑 Table of Contents

- [1. Executive Overview](#1-executive-overview)
- [2. System Architecture & Forensic Flow](#2-system-architecture--forensic-flow)
- [3. Core Technical Pillars & How It Works](#3-core-technical-pillars--how-it-works)
  - [Stage 01: Input Evidence Acquisition](#stage-01-input-evidence-acquisition)
  - [Stage 02: Neural Face Detection & Alignment](#stage-02-neural-face-detection--alignment)
  - [Stage 03: Ephemeral 512-D Biometric Encoding](#stage-03-ephemeral-512-d-biometric-encoding)
  - [Stage 04: Reverse Image Search Engine with Auto-Optimization](#stage-04-reverse-image-search-engine-with-auto-optimization)
  - [Stage 05: Social Media Classification & Priority Verification](#stage-05-social-media-classification--priority-verification)
  - [Stage 06: RFC-8785 Canonical Record Fingerprinting](#stage-06-rfc-8785-canonical-record-fingerprinting)
  - [Stage 07: Immutable Ethereum Smart Contract Registration](#stage-07-immutable-ethereum-smart-contract-registration)
- [4. Interactive Full-Stack Web Application](#4-interactive-full-stack-web-application)
- [5. Tamper Detection Sandbox & Mathematical Security](#5-tamper-detection-sandbox--mathematical-security)
- [6. Repository Structure](#6-repository-structure)
- [7. Quickstart & Installation](#7-quickstart--installation)
- [8. CLI & API Reference](#8-cli--api-reference)
- [9. Automated Test Suite](#9-automated-test-suite)
- [10. Privacy & Ethics Philosophy](#10-privacy--ethics-philosophy)

---

## 1. Executive Overview

**FaceTrace Ledger** is an enterprise-grade biometric discovery, open-source intelligence (OSINT) provenance analysis, and tamper-evident cryptographic audit platform.

In digital forensics, intellectual property protection, and biometric auditability, identifying whether a portrait image appears publicly on the web while proving provenance without violating subject privacy has historically been a critical challenge.

```
       ┌──────────────────┐               ┌───────────────────┐               ┌──────────────────┐
       │   INPUT IMAGE    │ ────────────> │  BIOMETRIC SEARCH │ ────────────> │ CANONICAL RECORD │
       │ (User Upload/CV) │               │   & VERIFICATION  │               │   (RFC-8785 JSON)│
       └──────────────────┘               └───────────────────┘               └─────────┬────────┘
                                                                                        │
                                                                                        ▼
       ┌──────────────────┐               ┌───────────────────┐               ┌──────────────────┐
       │ TAMPER DETECTION │ <──────────── │  RE-VERIFICATION  │ <──────────── │ BLOCKCHAIN MINED │
       │ (Hash Mismatch)  │               │ (On-Chain Lookup) │               │ (Smart Contract) │
       └──────────────────┘               └───────────────────┘               └──────────────────┘
```

### ✨ Key Innovations

1. **Genuine Dynamic Reverse Search**: No hardcoded mocks. Uploaded photos are dynamically optimized and queried against Google Lens via SerpApi.
2. **Post-Level Social Media Classification & Prioritization**: Differentiates `SOCIAL_MEDIA_POST`, `SOCIAL_MEDIA_PROFILE`, `SOCIAL_MEDIA_PAGE`, and `GENERAL_WEB_RESULT` across 9 platforms (Instagram, X, Reddit, TikTok, LinkedIn, Pinterest, Facebook, Threads, YouTube), prioritizing actual social posts for verification.
3. **Zero-Biometric On-Chain Footprint**: Biometric vectors and facial images are **never stored on the blockchain or persisted in public databases**. Only deterministic SHA-256 digests of structured provenance records are anchored on-chain.
4. **Mathematical Tamper Evidence**: Changing a single comma, URL, social platform tag, or similarity score alters the canonical SHA-256 fingerprint and causes immediate on-chain verification failure.
5. **Production-Ready Full-Stack Experience**: High-contrast, brutalist editorial UI with live Server-Sent Events (SSE), Stop Execution, Restart Execution, Reset to New Investigation, Tamper Simulator, and Forensic PDF/JSON/CSV exports.

---

## 2. System Architecture & Forensic Flow

```mermaid
flowchart TD
    subgraph S1["1. ACQUISITION & BIOMETRICS"]
        A["Input Portrait Image"] -->|"SHA-256 Digest"| B["InsightFace Buffalo_SC"]
        B -->|"Bounding Box & Landmarks"| C["512-D Normalized Vector"]
        C -->|"Ephemeral State"| D["Memory Cache (Privacy Safe)"]
    end

    subgraph S2["2. DYNAMIC SEARCH & SOCIAL ENGINE"]
        A -->|"Auto-Optimize <=450KB"| E["SerpApi Lens Provider"]
        E -->|"HTTP 200 (search_id)"| F["Raw Visual Matches (50-60)"]
        F --> G["Social Media URL Classifier"]
        G -->|"Sort by Priority"| H["Candidate Queue"]
        H -->|"1. SOCIAL_MEDIA_POST\n2. SOCIAL_MEDIA_PROFILE\n3. SOCIAL_MEDIA_PAGE\n4. GENERAL_WEB"| I["Candidate Image Downloader"]
    end

    subgraph S3["3. COMPARISON & VERIFICATION"]
        I --> J["InsightFace Biometric Matching"]
        D -.->|"Cosine Similarity"| J
        J --> K{"Cosine Score >= 0.65?"}
        K -->|"No"| L["Honest NO_MATCH Status"]
        K -->|"Yes"| M["Best Verified Social Match"]
    end

    subgraph S4["4. CANONICAL RECORD & FINGERPRINT"]
        M --> N["Build Verification Record"]
        N --> O["RFC-8785 Canonical JSON"]
        O --> P["SHA-256 Cryptographic Hash"]
    end

    subgraph S5["5. IMMUTABLE BLOCKCHAIN LEDGER"]
        P --> Q["Solidity Smart Contract (RecordLedger.sol)"]
        Q --> R["Ethereum Mined Block (Tx Hash, Block #)"]
        R --> S["On-Chain Re-Verification Query"]
        S --> T{"Record Exists & Hash Matches?"}
        T -->|"Yes"| U["[OK] VERIFIED ON-CHAIN"]
        T -->|"No / Modified"| V["[ALERT] TAMPERING DETECTED"]
    end

    style S1 fill:#0A2E23,stroke:#00E599,stroke-width:2px,color:#FAF7F0
    style S2 fill:#071F17,stroke:#F50064,stroke-width:2px,color:#FAF7F0
    style S3 fill:#141414,stroke:#00E599,stroke-width:2px,color:#FAF7F0
    style S4 fill:#0A2E23,stroke:#F50064,stroke-width:2px,color:#FAF7F0
    style S5 fill:#071F17,stroke:#00E599,stroke-width:2px,color:#FAF7F0
```

---

## 3. Core Technical Pillars & How It Works

### Stage 01: Input Evidence Acquisition
- **File Ingestion**: Accepts JPG, PNG, WEBP local uploads or sample portraits.
- **Cryptographic Fingerprinting**: Immediately computes the input image's raw SHA-256 hash (NIST FIPS 180-4) to guarantee binary immutability from the first millisecond.

### Stage 02: Neural Face Detection & Alignment
- **Model**: InsightFace `buffalo_sc` (500M ResNet detection model).
- **Processing**: Detects facial bounding box `[x1, y1, x2, y2]`, detection confidence, and 5-point facial landmark coordinates (left eye, right eye, nose tip, left mouth, right mouth) with affine transformation alignment.

### Stage 03: Ephemeral 512-D Biometric Encoding
- **Embedding Extraction**: Extracts a 512-dimensional normalized unit vector ($L_2$ norm = 1.0) using the `w600k_mbf` neural recognition backbone.
- **Zero-Persistence Guarantee**: The embedding exists only in volatile memory during pipeline execution. It is never logged, never saved to disk, and never stored on-chain.

### Stage 04: Reverse Image Search Engine with Auto-Optimization
- **In-Memory Image Optimization**: High-resolution camera photos (2MB to 10MB) are automatically resized and compressed in-memory via OpenCV to under 450KB (complying strictly with SerpApi's 500KB ceiling) without degrading facial features.
- **Request Tracing & Diagnostics**: Every reverse search generates a unique `search_request_id` (e.g. `search_20260902_43faae`) and logs the full lifecycle with masked credentials (`96d5****fab8`).
- **Transient Retry Mechanism**: Built-in exponential backoff automatically retries network timeouts and 5xx errors up to 2 times without retrying client 4xx configuration errors.

```
+-----------------------------------------------------------------------------------+
| [SEARCH] [search_20260902_43faae] Preparing reverse-image request                 |
| [SEARCH] Image optimized: 2589.6 KB -> 14.6 KB (531x396 px, Q=25)                |
| [SEARCH] Provider: SerpApi | Engine: Google Lens                                  |
| [SEARCH] Request sent -> HTTP 200 OK                                              |
| [SEARCH] Results parsed: 60 visual matches (16 social media candidates)           |
+-----------------------------------------------------------------------------------+
```

### Stage 05: Social Media Classification & Priority Verification
The system classifies all candidate URLs into 4 distinct types across 9 major platforms:

| Platform | Domain Identifier | Post Regex / Identifier | Result Type |
| :--- | :--- | :--- | :--- |
| **Instagram** | `instagram.com` | `/p/`, `/reel/`, `/reels/`, `/tv/` | `SOCIAL_MEDIA_POST` |
| **X (Twitter)** | `x.com`, `twitter.com` | `/[user]/status/[id]` | `SOCIAL_MEDIA_POST` |
| **Reddit** | `reddit.com` | `/r/[sub]/comments/[id]/...` | `SOCIAL_MEDIA_POST` |
| **TikTok** | `tiktok.com` | `/@ [user]/video/[id]` | `SOCIAL_MEDIA_POST` |
| **LinkedIn** | `linkedin.com` | `/posts/`, `/feed/update/`, `/pulse/` | `SOCIAL_MEDIA_POST` |
| **Pinterest** | `pinterest.com` | `/pin/[id]/` | `SOCIAL_MEDIA_POST` |
| **Facebook** | `facebook.com` | `/posts/`, `/photo.php`, `/permalink.php` | `SOCIAL_MEDIA_POST` |
| **Threads** | `threads.net` | `/@ [user]/post/[id]` | `SOCIAL_MEDIA_POST` |
| **YouTube** | `youtube.com` | `/watch?v=...`, `/shorts/...` | `SOCIAL_MEDIA_POST` |

#### Candidate Prioritization Queue
Candidate URLs are sorted with strict priority:
$$\text{Priority } 1: \text{SOCIAL\_MEDIA\_POST} \longrightarrow \text{Priority } 2: \text{SOCIAL\_MEDIA\_PROFILE} \longrightarrow \text{Priority } 3: \text{SOCIAL\_MEDIA\_PAGE} \longrightarrow \text{Priority } 4: \text{GENERAL\_WEB\_RESULT}$$

Each candidate thumbnail is downloaded safely with MIME/size validations, faces are detected and aligned, and Cosine Similarity is calculated:
$$\text{Similarity}(u, v) = \frac{u \cdot v}{\|u\|_2 \|v\|_2} \ge 0.65$$

### Stage 06: RFC-8785 Canonical Record Fingerprinting
When a candidate matches, a canonical verification record is constructed:

```json
{
  "candidate_image_sha256": "232703645b370c8eb5456c2befc126f95fb3aa3da338914faa020ac44c49bf8e",
  "image_sha256": "7de7ed51a1594fff247f4cae2301eceacf5313d6011e37b4a4c8733f7bb72c07",
  "is_social_media": true,
  "record_version": "1.0",
  "result_title": "lena.jpg now : r/programming",
  "result_type": "SOCIAL_MEDIA_POST",
  "search_provider": "serpapi_lens",
  "similarity_score": 0.9378,
  "similarity_threshold": 0.65,
  "social_platform": "reddit",
  "source_domain": "reddit.com",
  "source_url": "https://www.reddit.com/r/programming/comments/dobz8s/lenajpg_now/",
  "verified_at": "2026-09-02T06:26:22.486015+00:00"
}
```

- **Deterministic Canonicalization**: Serialized with sorted keys (`sort_keys=True`) and minimal separators (`,`, `:`) without whitespace variations.
- **SHA-256 Digest**: Generates a 64-character hex string representing the mathematical seal of this exact forensic discovery.

### Stage 07: Immutable Ethereum Smart Contract Registration
The fingerprint is converted to `bytes32` and registered on an Ethereum smart contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FaceTraceVerification {
    struct VerificationRecord {
        bytes32 recordHash;
        uint256 timestamp;
        address submitter;
        bool exists;
    }

    mapping(bytes32 => VerificationRecord) public records;
    bytes32[] public allRecordHashes;

    event RecordRegistered(bytes32 indexed recordHash, address indexed submitter, uint256 timestamp);

    function registerRecord(bytes32 _recordHash) external returns (bool) {
        require(_recordHash != bytes32(0), "Invalid zero hash");
        require(!records[_recordHash].exists, "Record hash already registered");

        records[_recordHash] = VerificationRecord({
            recordHash: _recordHash,
            timestamp: block.timestamp,
            submitter: msg.sender,
            exists: true
        });

        allRecordHashes.push(_recordHash);
        emit RecordRegistered(_recordHash, msg.sender, block.timestamp);
        return true;
    }

    function verifyRecord(bytes32 _recordHash) external view returns (bool exists, uint256 timestamp, address submitter) {
        VerificationRecord memory rec = records[_recordHash];
        return (rec.exists, rec.timestamp, rec.submitter);
    }
}
```

---

## 4. Interactive Full-Stack Web Application

The frontend is built using **React 18 + TypeScript + Vite + Tailwind CSS v4** adhering to the high-contrast, brutalist Hacker House Goa editorial aesthetic (*Forest Green `#0A2E23`, Warm Cream `#F5F0E3`, Hot Pink `#F50064`, Charcoal `#141414`*).

```
+---------------------------------------------------------------------------------------+
|  FACETRACE LEDGER  //  AI BIOMETRIC DISCOVERY & BLOCKCHAIN VERIFICATION LAB           |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|  [ STAGE 01: ACQUIRE ] ──> [ STAGE 02: DETECT ] ──> [ STAGE 03: ENCODE ]              |
|  [ STAGE 04: SEARCH  ] ──> [ STAGE 05: COMPARE ] ──> [ STAGE 06: DIGEST ]             |
|  [ STAGE 07: LEDGER  ]                                                                |
|                                                                                       |
|  CONTROLS:  [ STOP EXECUTION ]   [ RESTART TRACE ]   [ NEW INVESTIGATION ]            |
|                                                                                       |
|  ===================================================================================  |
|  [A] INPUT SUBJECT ARTIFACT            |  [B] DISCOVERED REDDIT POST MATCH           |
|  Image: lena.jpg                       |  Platform: REDDIT | Result: SOCIAL_MEDIA_POST|
|  SHA-256: 7de7ed51...                  |  Title: lena.jpg now : r/programming         |
|  Face: 512-D Normalized Vector         |  Similarity: 93.78% (Threshold: 65.0%)       |
|  ===================================================================================  |
|                                                                                       |
|  BLOCKCHAIN STATE:                                                                    |
|  Status: VERIFIED ON-CHAIN             |  Smart Contract: 0x5b1869...                 |
|  Block: #1                             |  Tx Hash: 0x15105fcad...                     |
|                                                                                       |
|  EXPORT CENTER:   [ EXPORT PDF REPORT ]   [ EXPORT JSON ]   [ EXPORT CSV ]            |
+---------------------------------------------------------------------------------------+
```

### Key UI Features
- **Live SSE Telemetry**: Streams real-time progress for all 7 stages without polling.
- **Control Suite**:
  - **`[ STOP EXECUTION ]`**: Immediately aborts processing at the current stage.
  - **`[ RESTART TRACE ]`**: Creates a brand new, isolated `job_id` and re-executes all stages afresh.
  - **`[ NEW IMAGE ]`**: Clears all states, inputs, and previews for a fresh investigation.
- **Tamper Testing Sandbox**: Interactive live mutation simulator where users can modify any field (e.g. `social_platform`, `similarity_score`) to see the smart contract mathematically reject the altered record.
- **Forensic Export Center**: One-click generation of court-ready PDF audit reports with cryptographic stamps, raw JSON evidence bundles, and spreadsheet CSVs.

---

## 5. Tamper Detection Sandbox & Mathematical Security

```
                               ┌────────────────────────────────┐
                               │ Original Record:               │
                               │ social_platform = "reddit"     │
                               │ Hash: 51e9de61...              │
                               └───────────────┬────────────────┘
                                               │
                                       (Altered to "x")
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │ Tampered Record:               │
                               │ social_platform = "x"          │
                               │ Hash: 67823d59...              │
                               └───────────────┬────────────────┘
                                               │
                                      (Smart Contract Lookup)
                                               │
                                               ▼
                            ╔══════════════════════════════════════╗
                            ║ [FAILED] HASH_MISMATCH               ║
                            ║ SECURITY ALERT: DATA HAS BEEN TAMPERED║
                            ╚══════════════════════════════════════╝
```

Any discrepancy between the local record and the on-chain fingerprint guarantees **100% mathematical detection of data corruption or tampering**.

---

## 6. Repository Structure

```
FaceTraceLedger/
├── contracts/
│   └── FaceTraceVerification.sol       # Solidity Smart Contract (^0.8.20)
├── data/
│   ├── input/                          # Test portrait images (Lena, portraits)
│   ├── candidates/                     # Candidate downloaded thumbnails
│   └── results/                        # Generated JSON verification records
├── frontend/
│   ├── src/
│   │   ├── components/                 # React UI components (Uploader, Comparison, Ledger)
│   │   ├── hooks/                      # usePipeline state manager with SSE
│   │   ├── services/                   # API client (Axios/Fetch, SSE, REST)
│   │   ├── types/                      # TypeScript definitions (Pipeline, Blockchain, Social)
│   │   └── utils/                      # PDF, JSON, CSV export formatters
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── src/
│   ├── api/
│   │   └── server.py                   # FastAPI REST & SSE Backend Service
│   ├── blockchain/
│   │   ├── client.py                   # Web3 & Py-EVM local blockchain client
│   │   ├── uploader.py                 # Smart contract transaction signer
│   │   └── verifier.py                 # On-chain state verifier
│   ├── crypto/
│   │   └── hashing.py                  # SHA-256 & bytes32 conversions
│   ├── face/
│   │   ├── detector.py                 # InsightFace detection & bounding box
│   │   ├── encoder.py                  # 512-D normalized embedding extractor
│   │   └── matcher.py                  # Cosine similarity evaluator
│   ├── record/
│   │   ├── canonicalizer.py            # RFC-8785 JSON canonicalizer
│   │   └── metadata_builder.py         # Structured verification record builder
│   ├── search/
│   │   ├── candidate_downloader.py     # Resilient image downloader
│   │   ├── candidate_verifier.py       # Priority sorting & face verification
│   │   ├── result_parser.py            # Social media classifier (9 platforms)
│   │   ├── reverse_search.py           # Search coordinator
│   │   └── providers/
│   │       ├── base.py                 # Provider abstract interface
│   │       ├── factory.py              # Provider registry
│   │       └── serpapi_lens.py         # Google Lens provider with auto-compression
│   ├── config.py                       # Centralized typed environment config
│   └── main.py                         # Complete CLI pipeline entrypoint
├── tests/
│   ├── test_blockchain.py              # Smart contract tests
│   ├── test_face.py                    # Face detection & cosine math tests
│   ├── test_hashing.py                 # SHA-256 deterministic tests
│   ├── test_pipeline_e2e.py            # Full end-to-end integration tests
│   ├── test_record.py                  # Canonical JSON schema tests
│   ├── test_search.py                  # Provider & URL parser tests
│   ├── test_serpapi_robustness.py      # Masked keys & optimization tests
│   └── test_social_media_classification.py # 20 Social media classification tests
├── requirements.txt                    # Python dependencies
├── pytest.ini                          # Pytest configuration
├── .env.example                        # Environment template
└── README.md                           # Master documentation
```

---

## 7. Quickstart & Installation

### Prerequisites
- **Python**: `3.11+` / `3.12+` / `3.14+`
- **Node.js**: `18.0+` & `npm`
- **SerpApi API Key**: Get a free key at [serpapi.com](https://serpapi.com)

### Step 1: Clone & Setup Backend Virtual Environment
```bash
git clone https://github.com/your-username/FaceTraceLedger.git
cd FaceTraceLedger

python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` with your settings:
```env
# Face Recognition Settings
FACE_MATCH_THRESHOLD=0.65

# Reverse Image Search Configuration
REVERSE_SEARCH_PROVIDER=serpapi_lens
SEARCH_API_KEY=your_serpapi_key_here

# Blockchain Configuration (Built-in Py-EVM is used automatically if no external RPC is provided)
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_CHAIN_ID=1337
CONTRACT_ADDRESS=

# Logging
LOG_LEVEL=INFO
```

### Step 3: Start the Backend Server
```bash
# Windows (using Python launcher):
py -m uvicorn src.api.server:app --port 8000 --host 127.0.0.1

# Linux / macOS / Virtual Environment:
python -m uvicorn src.api.server:app --port 8000 --host 127.0.0.1
```
*Backend runs on `http://127.0.0.1:8000`.*

### Step 4: Start the Frontend UI
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://127.0.0.1:5173`.*

---

## 8. CLI & API Reference

### CLI Commands

#### 1. Full Pipeline Execution
```bash
python -m src.main run --image data/input/lena.jpg
```
*Options:*
- `--require-social-media`: Restricts match selection strictly to verified `SOCIAL_MEDIA_POST` results.
- `--threshold 0.70`: Custom cosine similarity threshold.

#### 2. Independent Blockchain Verification
```bash
python -m src.main verify --record data/results/verification_record.json
```

#### 3. Tamper Detection Demonstration
```bash
python -m src.main demo-tamper --record data/results/verification_record.json
```

---

### REST & SSE API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/pipeline/run` | Starts an isolated pipeline job. Supports multipart file upload or sample name. |
| `GET` | `/api/pipeline/events/{job_id}` | Live Server-Sent Events (SSE) streaming progress across all 7 stages. |
| `GET` | `/api/pipeline/result/{job_id}` | Retrieves completed job artifacts, metadata, and blockchain transactions. |
| `POST` | `/api/pipeline/{job_id}/cancel` | Immediately requests graceful cancellation of a running job. |
| `POST` | `/api/pipeline/{job_id}/restart` | Re-executes the pipeline with a brand new `job_id`. |
| `POST` | `/api/verify` | Verifies any JSON verification record against on-chain smart contract state. |
| `POST` | `/api/tamper-test` | Mutates a record field and evaluates on-chain hash mismatch. |
| `GET` | `/api/diagnostics/search-provider` | Returns provider status, engine, and masked credentials. |
| `GET` | `/api/health` | Comprehensive system health check for Face Engine, Search Provider, and Blockchain. |

---

## 9. Automated Test Suite

FaceTrace Ledger features a **100% automated test suite with 47 tests** covering computer vision math, hashing determinism, search classification, smart contracts, and full pipeline integration.

```bash
pytest -v
```

### Test Suite Execution Output
```
tests/test_blockchain.py::test_blockchain_register_and_verify PASSED          [  2%]
tests/test_blockchain.py::test_blockchain_tamper_detection PASSED             [  4%]
tests/test_blockchain.py::test_blockchain_duplicate_registration_rejection PASSED [  6%]
tests/test_face.py::test_cosine_similarity_identical PASSED                   [  8%]
tests/test_face.py::test_cosine_similarity_orthogonal PASSED                  [ 10%]
tests/test_face.py::test_face_matcher_threshold PASSED                        [ 12%]
tests/test_face.py::test_invalid_image_load PASSED                            [ 14%]
tests/test_face.py::test_face_encoding_dimension PASSED                       [ 17%]
tests/test_hashing.py::test_hash_string_deterministic PASSED                  [ 19%]
tests/test_hashing.py::test_hash_string_collision_resistance PASSED           [ 21%]
tests/test_hashing.py::test_hash_record_deterministic PASSED                  [ 23%]
tests/test_hashing.py::test_hash_record_tamper_detection PASSED               [ 25%]
tests/test_hashing.py::test_bytes32_conversion_roundtrip PASSED               [ 27%]
tests/test_hashing.py::test_bytes32_conversion_with_0x_prefix PASSED          [ 29%]
tests/test_hashing.py::test_bytes32_conversion_invalid_length PASSED          [ 31%]
tests/test_pipeline_e2e.py::test_full_pipeline_end_to_end PASSED              [ 34%]
tests/test_record.py::test_canonicalize_reordered_keys PASSED                 [ 36%]
tests/test_record.py::test_build_verification_record_valid PASSED             [ 38%]
tests/test_record.py::test_build_verification_record_invalid_sha256 PASSED   [ 40%]
tests/test_search.py::test_url_validation PASSED                              [ 42%]
tests/test_search.py::test_domain_extraction PASSED                           [ 44%]
tests/test_search.py::test_parse_search_results_deduplication PASSED          [ 46%]
tests/test_search.py::test_provider_factory_registration PASSED               [ 48%]
tests/test_serpapi_robustness.py::TestSerpApiRobustness::test_masked_key PASSED [ 51%]
tests/test_serpapi_robustness.py::TestSerpApiRobustness::test_missing_api_key_raises_auth_error PASSED [ 53%]
tests/test_serpapi_robustness.py::TestSerpApiRobustness::test_image_optimization_under_limit PASSED [ 55%]
tests/test_serpapi_robustness.py::TestSerpApiRobustness::test_nonexistent_image_raises PASSED [ 57%]
tests/test_social_media_classification.py::TestSocialMediaClassification::test_instagram_post PASSED [ 59%]
tests/test_social_media_classification.py::TestSocialMediaClassification::test_instagram_reel PASSED [ 61%]
tests/test_social_media_classification.py::TestSocialMediaClassification::test_instagram_profile PASSED [ 63%]
tests/test_social_media_classification.py::TestSocialMediaClassification::test_x_twitter_post PASSED [ 65%]
tests/test_social_media_classification.py::TestSocialMediaClassification::test_x_twitter_profile PASSED [ 68%]
tests/test_social_media_classification.py::TestSocialMediaClassification::test_reddit_post PASSED [ 70%]
tests/test_social_media_classification.py::TestSocialMediaClassification::test_reddit_user PASSED [ 72%]
tests/test_social_media_classification.py::TestSocialMediaClassification::test_reddit_subreddit_page PASSED [ 74%]
tests/test_social_media_classification.py::TestSocialMediaClassification::test_tiktok_video PASSED [ 76%]
tests/test_social_media_classification.py::TestSocialMediaClassification::test_tiktok_profile PASSED [ 78%]
tests/test_social_media_classification.py::TestSocialMediaClassification::test_pinterest_pin PASSED [ 80%]
tests/test_social_media_classification.py::TestSocialMediaClassification::test_linkedin_post PASSED [ 82%]
tests/test_social_media_classification.py::TestSocialMediaClassification::test_linkedin_profile PASSED [ 85%]
tests/test_social_media_classification.py::TestSocialMediaClassification::test_facebook_post PASSED [ 87%]
tests/test_social_media_classification.py::TestSocialMediaClassification::test_threads_post PASSED [ 89%]
tests/test_social_media_classification.py::TestSocialMediaClassification::test_general_website PASSED [ 91%]
tests/test_social_media_classification.py::TestSocialMediaClassification::test_malformed_urls_safe_fallback PASSED [ 93%]
tests/test_social_media_classification.py::TestCandidatePrioritization::test_priority_order PASSED [ 95%]
tests/test_social_media_classification.py::TestBlockchainRecordSocialProvenance::test_record_hash_includes_social_fields PASSED [ 97%]
tests/test_social_media_classification.py::TestBlockchainRecordSocialProvenance::test_onchain_verification_with_social_metadata PASSED [100%]

============================= 47 passed in 6.29s ==============================
```

---

## 10. Privacy & Ethics Philosophy

1. **Zero Raw Biometric Storage**: Face coordinates and 512-D embeddings are strictly ephemeral in-memory variables.
2. **Consent & Legitimate OSINT**: Engineered specifically for individuals, journalists, and security researchers verifying consent, copyright authenticity, and deepfake provenance.
3. **Immutable Accountability**: Prevents retroactively altering forensic discovery records or falsely claiming image provenance.
4. **Data Minimization**: Only the minimal necessary metadata (URL, domain, similarity score, cryptographic digests) is serialized into the canonical audit record.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for full details.

---

<p align="center">
  <strong>FaceTrace Ledger</strong> — <em>Crafted for Hacker House Goa 2026</em><br>
  Designed for verifiable biometric truth, privacy preservation, and mathematical transparency.
</p>
