# Besu Network Scripts

Scripts để quản lý và kiểm tra Besu Network.

## Scripts

### check-network.sh
Kiểm tra health của Besu Network:
- Kiểm tra trạng thái Docker containers
- Kiểm tra RPC endpoints
- Hiển thị block number và peer count
- Kiểm tra validators

**Usage:**
```bash
./scripts/check-network.sh
```

### start-network.sh
Khởi động Besu Network:
- Start tất cả Docker containers
- Đợi nodes khởi tạo
- Chạy health check

**Usage:**
```bash
./scripts/start-network.sh
```

### stop-network.sh
Dừng Besu Network:
- Stop tất cả Docker containers
- Giữ nguyên dữ liệu blockchain

**Usage:**
```bash
./scripts/stop-network.sh
```

### create-admin-account.sh
Tạo admin account cho giáo viên:
- Generate private key và address
- Tạo admin-account.json (chỉ public info)
- Tạo .env.example và .env (nếu chưa có)

**Usage:**
```bash
./scripts/create-admin-account.sh
```

**Requirements:**
- Node.js với ethers package, hoặc
- Python3 với eth-account package

**Note:** Sau khi tạo admin account, cần thêm address vào genesis.json trong phần `alloc` để fund account.

### setup-admin-python.py
Script Python để tạo admin account và tự động thêm vào genesis.json:
- Generate wallet bằng Python (eth-account)
- Tự động thêm admin address vào genesis.json
- Tạo .env và admin-account.json

**Usage:**
```bash
python3 scripts/setup-admin-python.py
```

**Requirements:**
- Python3 với eth-account package (sẽ tự động cài nếu chưa có)

### reset-and-setup-admin.sh
Script tự động reset mạng Besu và setup admin account:
- Dừng mạng Besu
- Xóa dữ liệu blockchain (⚠️ CẢNH BÁO: Mất dữ liệu)
- Tạo admin account mới
- Thêm admin vào genesis.json
- Khởi động lại mạng

**Usage:**
```bash
./scripts/reset-and-setup-admin.sh
```

**⚠️ WARNING:** Script này sẽ XÓA TẤT CẢ dữ liệu blockchain hiện tại!
Chỉ chạy ở giai đoạn đầu của dự án (Phase 1 → Phase 2).

**Requirements:**
- Python3 với eth-account package
