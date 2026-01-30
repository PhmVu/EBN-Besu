#!/usr/bin/env python3
"""
Script để tạo admin account và thêm vào genesis.json
Sử dụng Python3 với eth-account
"""

import json
import secrets
import sys
import os
from pathlib import Path

try:
    from eth_account import Account
except ImportError:
    print("Installing eth-account...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", "eth-account", "--quiet"])
    from eth_account import Account

def generate_wallet():
    """Tạo wallet mới"""
    private_key = "0x" + secrets.token_hex(32)
    account = Account.from_key(private_key)
    return {
        "address": account.address.lower(),
        "privateKey": private_key
    }

def update_genesis(genesis_file, admin_address):
    """Thêm admin address vào genesis.json"""
    balance = "0x200000000000000000000000000000000000000000000000000000000000000"
    
    with open(str(genesis_file), 'r') as f:
        genesis = json.load(f)
    
    if 'alloc' not in genesis:
        genesis['alloc'] = {}
    
    # Kiểm tra xem đã tồn tại chưa
    if admin_address.lower() in genesis['alloc']:
        print(f"Admin address {admin_address} đã tồn tại trong genesis.json")
        return False
    
    genesis['alloc'][admin_address.lower()] = {
        "balance": balance
    }
    
    # Backup
    backup_file = str(genesis_file) + ".backup"
    if os.path.exists(str(genesis_file)) and not os.path.exists(backup_file):
        import shutil
        shutil.copy2(str(genesis_file), backup_file)
    
    with open(str(genesis_file), 'w') as f:
        json.dump(genesis, f, indent=2)
    
    print(f"✓ Đã thêm admin address vào genesis.json")
    return True

def main():
    script_dir = Path(__file__).parent
    network_dir = script_dir.parent
    config_dir = network_dir / "config"
    genesis_file = config_dir / "genesis.json"
    env_file = network_dir / ".env"
    
    print("==========================================")
    print("Creating Admin Account (Python)")
    print("==========================================")
    print("")
    
    # Tạo wallet
    wallet = generate_wallet()
    print(f"Address: {wallet['address']}")
    print(f"Private Key: {wallet['privateKey']}")
    print("")
    
    # Tạo admin-account.json
    admin_account_file = config_dir / "admin-account.json"
    admin_account_data = {
        "address": wallet['address'],
        "note": "This is the admin account for teacher. Private key should be stored securely in .env file, not in this file."
    }
    with open(admin_account_file, 'w') as f:
        json.dump(admin_account_data, f, indent=2)
    print(f"Created {admin_account_file}")
    print("")
    
    # Tạo .env.example nếu chưa có
    env_example = network_dir / ".env.example"
    if not env_example.exists():
        env_example_content = f"""# Admin Account Configuration
# DO NOT commit the actual private key to git!
# Copy this file to .env and fill in the actual values

ADMIN_ADDRESS={wallet['address']}
ADMIN_PRIVATE_KEY=your_admin_private_key_here

# Besu Network Configuration
RPC_URL=http://localhost:8549
RPC_WS_URL=ws://localhost:8550
CHAIN_ID=1337
"""
        with open(env_example, 'w') as f:
            f.write(env_example_content)
        print(f"Created {env_example}")
        print("")
    
    # Tạo .env nếu chưa có
    if not env_file.exists():
        env_content = f"""# Admin Account Configuration
ADMIN_ADDRESS={wallet['address']}
ADMIN_PRIVATE_KEY={wallet['privateKey']}

# Besu Network Configuration
RPC_URL=http://localhost:8549
RPC_WS_URL=ws://localhost:8550
CHAIN_ID=1337
"""
        with open(env_file, 'w') as f:
            f.write(env_content)
        print(f"Created {env_file} with private key")
        print("⚠️  WARNING: The .env file contains sensitive information!")
        print("Make sure .env is in .gitignore and never commit it to version control.")
        print("")
    else:
        print("Note: .env file already exists. Not overwriting.")
        print("")
    
    # Cập nhật genesis.json
    if update_genesis(genesis_file, wallet['address']):
        print("")
        print("==========================================")
        print("Admin account setup completed!")
        print("==========================================")
        print("")
        print(f"Admin Address: {wallet['address']}")
        print(f"Private Key: (Xem trong {env_file})")
        print("")
        print("Genesis file đã được cập nhật với admin account.")
        print("Admin account đã được fund trong genesis.json.")
    else:
        print("Genesis file không được cập nhật (có thể đã tồn tại).")

if __name__ == "__main__":
    main()
