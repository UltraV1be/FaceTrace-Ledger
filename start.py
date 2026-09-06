"""
FaceTrace Ledger - Unified Startup Runner
Starts both the FastAPI backend (Uvicorn) and Vite React frontend in parallel.
Handles graceful shutdown on Ctrl+C.
"""

import sys
import os
import subprocess
import time
import signal
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"

def main():
    print("=" * 65)
    print("🚀 STARTING FACETRACE LEDGER (BACKEND + FRONTEND)")
    print("=" * 65)

    python_exe = sys.executable

    # 1. Start FastAPI Backend (Port 8000)
    print("[1/2] 🐍 Launching Backend API on http://127.0.0.1:8000 ...")
    backend_cmd = [
        python_exe,
        "-m",
        "uvicorn",
        "src.api.server:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
        "--reload"
    ]
    
    backend_process = subprocess.Popen(
        backend_cmd,
        cwd=str(ROOT_DIR),
        shell=False
    )

    # Allow backend 1 second to bind port
    time.sleep(1.0)

    # 2. Start Vite Frontend (Port 5173)
    print("[2/2] ⚡ Launching Frontend UI on http://localhost:5173 ...")
    
    # On Windows, use shell=True for npm command
    npm_cmd = "npm run dev" if sys.platform == "win32" else ["npm", "run", "dev"]
    
    frontend_process = subprocess.Popen(
        npm_cmd,
        cwd=str(FRONTEND_DIR),
        shell=(sys.platform == "win32")
    )

    print("\n" + "=" * 65)
    print("✅ SERVICES ONLINE:")
    print("   🌐 Frontend UI:  http://localhost:5173")
    print("   🔌 Backend API:  http://127.0.0.1:8000")
    print("   📖 Swagger Docs: http://127.0.0.1:8000/docs")
    print("=" * 65)
    print("💡 Press Ctrl+C at any time to stop both servers.\n")

    def shutdown(signum=None, frame=None):
        print("\n🛑 Shutting down FaceTrace Ledger services...")
        try:
            if sys.platform == "win32":
                subprocess.run(f"taskkill /F /T /PID {backend_process.pid}", shell=True, capture_output=True)
                subprocess.run(f"taskkill /F /T /PID {frontend_process.pid}", shell=True, capture_output=True)
            else:
                backend_process.terminate()
                frontend_process.terminate()
        except Exception:
            pass
        print("👋 All services stopped.")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, shutdown)

    try:
        while True:
            time.sleep(0.5)
            # Check if any process terminated unexpectedly
            if backend_process.poll() is not None:
                print(f"\n⚠️ Backend process exited with code {backend_process.returncode}")
                shutdown()
            if frontend_process.poll() is not None:
                print(f"\n⚠️ Frontend process exited with code {frontend_process.returncode}")
                shutdown()
    except KeyboardInterrupt:
        shutdown()

if __name__ == "__main__":
    main()
