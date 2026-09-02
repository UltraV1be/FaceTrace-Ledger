"""
Logging module for FaceTrace Ledger.
Provides clear, structured console logging suitable for screen recordings and pipelines.
Configured for Windows UTF-8 console compatibility.
"""

import sys
import logging
from typing import Any

# Ensure stdout and stderr use UTF-8 on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ANSI Colors
RESET = "\033[0m"
BOLD = "\033[1m"
GREEN = "\033[92m"
BLUE = "\033[94m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"
GRAY = "\033[90m"


class PipelineFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        level = record.levelname
        msg = record.getMessage()

        if level == "INFO":
            return f"{msg}"
        elif level == "WARNING":
            return f"{YELLOW}[WARNING] {msg}{RESET}"
        elif level == "ERROR":
            return f"{RED}[ERROR] {msg}{RESET}"
        elif level == "DEBUG":
            return f"{GRAY}[DEBUG] {msg}{RESET}"
        return f"[{level}] {msg}"


def setup_logger(name: str = "facetrace", level_name: str = "INFO") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level_name.upper(), logging.INFO))
    logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(PipelineFormatter())
    logger.addHandler(handler)
    logger.propagate = False
    return logger


logger = setup_logger()


def log_header(title: str, subtitle: str = ""):
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}{CYAN}{title.center(60)}{RESET}")
    if subtitle:
        print(f"{GRAY}{subtitle.center(60)}{RESET}")
    print(f"{BOLD}{'='*60}{RESET}\n")


def log_step(step_num: int, total_steps: int, title: str):
    print(f"\n{BOLD}{BLUE}[{step_num}/{total_steps}] {title}{RESET}")


def log_success(msg: str):
    try:
        print(f"  {GREEN}[OK] {msg}{RESET}")
    except UnicodeEncodeError:
        print(f"  [OK] {msg}")


def log_fail(msg: str):
    try:
        print(f"  {RED}[FAILED] {msg}{RESET}")
    except UnicodeEncodeError:
        print(f"  [FAILED] {msg}")


def log_info(label: str, val: Any):
    print(f"  {BOLD}{label}:{RESET} {val}")
