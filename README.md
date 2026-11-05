# Mini E-Commerce Hybrid DApp — Hướng Dẫn Khởi Chạy

Dự án Thương mại điện tử Web3 kết hợp MySQL (Off-chain) và Ethereum Smart Contract mạng Sepolia (On-chain).

---

#  Phân Công Thành Viên

| Thành viên | Phân hệ phụ trách | Thư mục |
| :--- | :--- | :--- |
| Hà | Database & Smart Contract | `database/`, `smart-contract/` |
| Khang | Backend & Blockchain Listener | `backend/` |
| Đông | Frontend & Web3 (MetaMask) | `frontend/` |

---

#  Các Bước Chạy Hệ Thống

# BƯỚC 1: Khởi tạo Cơ sở dữ liệu (MySQL)
1. Mở **XAMPP** và nhấn **Start** dịch vụ **MySQL**.
2. Mở terminal và chạy lệnh để tự động tạo CSDL và dữ liệu mẫu:
   ```bash
   cd backend
   npm install
   npm run init-db
   ```

---

### BƯỚC 2: Triển khai Smart Contract (Sepolia Testnet)
* **Cách 1 (Bằng lệnh Hardhat — Tự động đồng bộ):**
  ```bash
  cd smart-contract
  npm install
  npx hardhat run scripts/deploy.js --network sepolia
  ```
  *(Script sẽ tự động cập nhật Địa chỉ và ABI vào cả Backend và Frontend)*.

* **Cách 2 (Bằng Remix IDE):**
  1. Compile file `smart-contract/contracts/EcommercePayment.sol`.
  2. Deploy lên mạng **Sepolia** bằng ví MetaMask.
  3. Copy địa chỉ contract vừa deploy và dán vào file **`.env` ở thư mục gốc**:
     ```env
     CONTRACT_ADDRESS=0x_ĐỊA_CHỈ_VỪA_DEPLOY
     ```
     *(Nếu có sửa đổi code Solidity, copy ABI từ Remix dán vào file `contractData.json` ở thư mục gốc)*.

---

### BƯỚC 3: Khởi động Backend (Cổng 5000)
Mở một cửa sổ Terminal riêng:
```bash
cd backend
npm start
```
> Khi màn hình hiện `🚀 Server running on port 5000` và `⛓️ Initializing Blockchain Event Listener...` là thành công.

---

### BƯỚC 4: Khởi động Frontend (Cổng 5173)
Mở một cửa sổ Terminal khác:
```bash
cd frontend
npm install
npm run dev
```
1. Truy cập trình duyệt: **`http://localhost:5173`**
2. Cài tiện ích **MetaMask**, chuyển sang mạng **Sepolia Testnet**.
3. Bấm **"Kết nối Ví"** ở góc trên bên phải để bắt đầu mua sắm và thanh toán.

---

## Lưu Ý Quan Trọng Khi Chạy Nhóm
1. **Khởi động lại Backend:** Mỗi khi thay đổi địa chỉ hợp đồng mới, **bắt buộc phải tắt Backend (`Ctrl + C`) và chạy lại (`npm start`)** thì bộ lắng nghe mới kết nối được với hợp đồng mới.
2. **Cùng mạng Sepolia:** Cả 3 thành viên đều phải dùng MetaMask trên cùng mạng **Sepolia Testnet**.