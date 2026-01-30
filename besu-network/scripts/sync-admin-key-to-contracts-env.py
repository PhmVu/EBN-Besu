#!/usr/bin/env python3
"""
Sync ADMIN_PRIVATE_KEY from besu-network/.env into contracts/.env for Hardhat deploy.

Why:
- After resetting the Besu chain, we need to redeploy contracts using the funded admin key.
- contracts/.env is already gitignored; we keep the key out of git history.
"""

from __future__ import annotations

import re
from pathlib import Path


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    besu_env = repo_root / "besu-network" / ".env"
    contracts_env = repo_root / "contracts" / ".env"

    if not besu_env.exists():
        raise SystemExit(f"Missing {besu_env}. Run admin setup first.")

    text = besu_env.read_text(encoding="utf-8", errors="replace")
    m = re.search(r"^ADMIN_PRIVATE_KEY=(.+)$", text, flags=re.MULTILINE)
    if not m:
        raise SystemExit("ADMIN_PRIVATE_KEY not found in besu-network/.env")

    admin_private_key = m.group(1).strip()
    if not admin_private_key.startswith("0x") or len(admin_private_key) < 10:
        raise SystemExit("ADMIN_PRIVATE_KEY looks invalid (expected hex string starting with 0x)")

    # Viết cả RPC_URL (Hardhat dùng) và BESU_RPC_URL (để rõ nghĩa)
    contracts_env.write_text(
        "RPC_URL=http://localhost:8549\n"
        "BESU_RPC_URL=http://localhost:8549\n"
        f"ADMIN_PRIVATE_KEY={admin_private_key}\n",
        encoding="utf-8",
    )

    print(f"Wrote {contracts_env} (BESU_RPC_URL + ADMIN_PRIVATE_KEY).")


if __name__ == "__main__":
    main()

