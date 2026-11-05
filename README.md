# Mini E-Commerce Tích Hợp Thanh Toán Smart Contract (Hybrid DApp)

Dự án xây dựng hệ thống thương mại điện tử mini áp dụng mô hình ứng dụng phân tán lai (**Hybrid DApp**). Hệ thống kết hợp tối ưu giữa kiến trúc Web truyền thống (**Off-chain**) trên **MySQL** để quản lý dữ liệu sản phẩm, người dùng và Blockchain (**On-chain**) trên mạng **Ethereum / Sepolia** để thực hiện giao dịch thanh toán minh bạch, tự động và bất biến thông qua **Smart Contract**.

---

## 🎯 Giới thiệu & Bài toán giải quyết

* **Bài toán thực tế:**
  * Các hệ thống thương mại điện tử truyền thống phụ thuộc hoàn toàn vào các cổng thanh toán trung gian tập trung (nguy cơ nghẽn mạng, phí giao dịch bên thứ ba, thiếu tính độc lập và minh bạch).
  * Ngược lại, nếu lưu trữ toàn bộ dữ liệu (hình ảnh sản phẩm, danh mục, giỏ hàng, thông tin cá nhân) trực tiếp lên Blockchain sẽ gây tốn chi phí Gas khổng lồ và tốc độ xử lý đơn hàng rất chậm.
* **Giải pháp Hybrid DApp:**
  * **Off-chain (Cơ sở dữ liệu truyền thống MySQL):** Lưu trữ danh mục, thông tin sản phẩm, giỏ hàng, lịch sử đơn hàng nhằm đạt tốc độ truy xuất cực nhanh, trải nghiệm mượt mà và tối ưu hóa 100% chi phí lưu trữ.
  * **On-chain (Ethereum Smart Contract & MetaMask):** Xử lý luồng nhận tiền thanh toán (ETH), phát sự kiện giao dịch, chống thanh toán trùng lặp (*Double-payment*) và đảm bảo tính bất biến, minh bạch tuyệt đối cho các giao dịch tài chính.

---

## 🏛️ Kiến trúc hệ thống (Hybrid Architecture)

```text
[ Frontend: ReactJS + Web3 / MetaMask ]
   │                               │
   │ (REST API HTTP/JSON)          │ (Ký & gửi giao dịch ETH qua RPC)
   ▼                               ▼
[ Backend: Node.js (Express) ]     [ Smart Contract (Ethereum Sepolia / Hardhat) ]
   │                               │
   │ (Query / Update)              │ (Phát sự kiện On-chain: PaymentCompleted)
   ▼                               ▼
[ MySQL Database ] <───────────────┘ 
    (Off-chain)      (Backend Blockchain Listener bắt sự kiện và cập nhật đơn hàng)
```

### 🔄 Luồng hoạt động chính (4 bước cốt lõi):

1. **Duyệt hàng & Đặt hàng (Off-chain):** Người mua xem danh mục sản phẩm, thêm hàng vào giỏ và nhấn **"Đặt hàng"**. Backend tạo bản ghi đơn hàng trong MySQL với trạng thái mặc định: `Chờ thanh toán` (`PENDING`).
2. **Thanh toán Web3 (Frontend & MetaMask):** Khách hàng chọn phương thức thanh toán bằng Blockchain. Frontend lấy `OrderID` cùng tổng tiền ETH từ Backend, yêu cầu người dùng xác nhận và ký giao dịch gửi ETH trực tiếp đến hàm `payOrder(orderId)` trên Smart Contract qua ví MetaMask.
3. **Thực thi & Lưu vết On-chain (Smart Contract):** Smart Contract kiểm tra tính hợp lệ của đơn hàng (chưa từng thanh toán trước đó), nhận ETH và phát ra sự kiện on-chain:
   ```solidity
   event PaymentCompleted(uint256 indexed orderId, address indexed buyer, uint256 amount, uint256 timestamp);
   ```
4. **Lắng nghe & Tự động đồng bộ (Backend Listener):** Module `blockchainListener.js` (sử dụng thư viện `ethers.js`) liên tục lắng nghe sự kiện `PaymentCompleted` từ Blockchain. Khi nhận được event, Backend tự động:
   * Cập nhật trạng thái đơn hàng trong MySQL từ `PENDING` sang `PAID` (Đã thanh toán).
   * Ghi nhận địa chỉ ví thanh toán (`buyer_wallet`), mã giao dịch (`tx_hash`) và thời điểm hoàn tất (`paid_at`).
   * **Khóa hủy đơn hàng:** Kích hoạt cơ chế chặn toàn bộ hành vi hủy/xóa đơn hàng từ phía người dùng sau khi tiền đã được xác thực an toàn vào Smart Contract.

---

## 👥 Phân công nhiệm vụ thành viên (Team Structure)

| Vai trò | Thành viên | Nhiệm vụ chính & File phụ trách |
| :--- | :--- | :--- |
| **Database & Smart Contract**<br>*(Data Layer)* | **Quang Hà** | - Thiết kế lược đồ CSDL quan hệ ERD và viết script tạo bảng MySQL (`users`, `categories`, `products`, `cart_items`, `orders`, `order_items`) hỗ trợ cơ chế xóa mềm (*Soft Delete*).<br>- Viết Smart Contract [`EcommercePayment.sol`](smart-contract/contracts/EcommercePayment.sol) bằng Solidity (^0.8.24) nhận ETH, chống Double-payment, hỗ trợ rút tiền (`withdraw`) và phát sự kiện `PaymentCompleted`.<br>- Cấu hình môi trường Hardhat, viết script tự động deploy và đồng bộ ABI/địa chỉ contract ([`scripts/deploy.js`](smart-contract/scripts/deploy.js)), viết 8 kịch bản kiểm thử tự động ([`test/EcommercePayment.test.js`](smart-contract/test/EcommercePayment.test.js)). |
| **Backend Developer**<br>*(Off-chain Logic)* | **Khang** | - Xây dựng hệ thống RESTful API hoàn chỉnh trên Node.js/Express: xác thực người dùng JWT/bcrypt, quản lý danh mục, CRUD sản phẩm, giỏ hàng và tạo đơn hàng.<br>- Xây dựng module [`blockchainListener.js`](backend/src/services/blockchainListener.js) sử dụng `ethers.js` kết nối RPC Provider để lắng nghe sự kiện `PaymentCompleted` thời gian thực.<br>- Xử lý cập nhật trạng thái đơn hàng sang `PAID`, lưu vết giao dịch On-chain vào MySQL và chặn request hủy đơn hàng đã thanh toán (HTTP 400). |
| **Frontend Developer**<br>*(UI/UX & Web3)* | **Lưu Nhật Đông** | - Xây dựng toàn bộ giao diện người dùng bằng ReactJS (Vite), Tailwind CSS và thư viện icon Lucide.<br>- Xây dựng dịch vụ [`web3Service.js`](frontend/src/services/web3Service.js) tích hợp ví MetaMask: kết nối ví, tự động kiểm tra mạng (Hardhat / Sepolia), chuyển đổi đơn vị Wei/ETH.<br>- Tích hợp gọi hàm thanh toán `payOrder` trên Smart Contract, hiển thị Modal tiến trình giao dịch (đang xác thực, chờ khối, hoàn tất) và cập nhật giao diện theo thời gian thực. |

---

## 💻 Công nghệ sử dụng

* **Blockchain & Smart Contract:**
  * Ngôn ngữ: `Solidity` (^0.8.24).
  * Framework & Tooling: `Hardhat`, `@nomicfoundation/hardhat-toolbox`.
  * Mạng thử nghiệm: `Hardhat Localhost Node` (Chain ID: `31337`), `Ethereum Sepolia Testnet` (Chain ID: `11155111`).
* **Tích hợp Web3:**
  * `Ethers.js` (v6) - Dùng cho cả Frontend (BrowserProvider) và Backend (JsonRpcProvider).
  * Ví điện tử: `MetaMask`.
* **Backend:**
  * Nền tảng: `Node.js`, `Express.js`.
  * Cơ sở dữ liệu: `MySQL 8` kết hợp driver `mysql2/promise` (Connection Pooling).
  * Bảo mật & Tiện ích: `jsonwebtoken` (JWT), `bcryptjs`, `cors`, `dotenv`, `multer`.
* **Frontend:**
  * Thư viện: `React 18` kết hợp công cụ đóng gói `Vite`.
  * Giao diện: `Tailwind CSS`, `Lucide React Icons`.
  * Giao tiếp API: `Fetch API` / `Axios`.

---

## 📂 Cấu trúc thư mục mã nguồn

```text
DA-BlockChain/
├── database/                    # Quản lý Dữ liệu MySQL (Quang Hà)
│   ├── schema.sql               # Script khởi tạo Database, 6 bảng quan hệ & dữ liệu mẫu
│   └── ERD_Documentation.md     # Tài liệu thiết kế ERD, cơ chế Soft Delete & phân tích On/Off-chain
│
├── smart-contract/              # Quản lý Hợp đồng thông minh (Quang Hà)
│   ├── contracts/               
│   │   └── EcommercePayment.sol # Hợp đồng thông minh nhận ETH & emit event
│   ├── scripts/
│   │   └── deploy.js            # Script biên dịch, deploy & đồng bộ ABI sang Backend/Frontend
│   ├── test/
│   │   └── EcommercePayment.test.js # Bộ 8 bài test kiểm thử tự động logic Smart Contract
│   ├── hardhat.config.js        # Cấu hình mạng Localhost & Sepolia Testnet
│   └── package.json             
│
├── backend/                     # RESTful API & Blockchain Event Listener (Khang)
│   ├── src/
│   │   ├── config/              # Kết nối MySQL Pool (db.js), tự tạo bảng (initDb.js)
│   │   ├── controllers/         # Xử lý nghiệp vụ: Auth, Products, Cart, Orders, Admin
│   │   ├── middleware/          # Xác thực quyền JWT (authMiddleware.js)
│   │   ├── routes/              # Định tuyến API endpoints (/api/auth, /api/orders, ...)
│   │   ├── services/
│   │   │   └── blockchainListener.js # Lắng nghe sự kiện PaymentCompleted qua ethers.js
│   │   └── server.js            # Entry point khởi chạy Express server (Port 5000)
│   └── package.json
│
├── frontend/                    # Giao diện người dùng & Web3 Integration (Lưu Nhật Đông)
│   ├── src/
│   │   ├── components/          # Giao diện: Navbar, ProductCard, CartDrawer, OrderHistory, ...
│   │   ├── contracts/           # Chứa contractData.json (ABI & địa chỉ do script deploy tự sinh)
│   │   ├── services/
│   │   │   ├── web3Service.js   # Kết nối MetaMask, gọi hàm payOrder Smart Contract
│   │   │   └── apiService.js    # Tương tác với Backend Express API
│   │   ├── App.jsx              # Giao diện chính của ứng dụng
│   │   └── main.jsx
│   ├── tailwind.config.js       # Cấu hình Tailwind CSS
│   └── package.json
│
└── README.md                    # Tài liệu tổng quan dự án
```

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy dự án

### BƯỚC 1: Khởi tạo Cơ sở dữ liệu & Triển khai Smart Contract (Quang Hà)

#### 1. Khởi tạo Cơ sở dữ liệu MySQL:
1. Mở XAMPP và khởi động dịch vụ **MySQL**.
2. Nhập dữ liệu ban đầu bằng một trong hai cách:
   * **Cách A (Giao diện phpMyAdmin):** Import trực tiếp file [`database/schema.sql`](database/schema.sql) vào phpMyAdmin.
   * **Cách B (Script tự động):**
     ```powershell
     cd backend
     npm install
     npm run init-db
     ```

#### 2. Kiểm thử & Triển khai Smart Contract:
1. Mở cửa sổ Terminal tại thư mục `smart-contract`:
   ```powershell
   cd smart-contract
   npm install
   ```
2. Chạy bộ Unit Test kiểm tra toàn bộ 8 kịch bản nghiệp vụ:
   ```powershell
   npx hardhat test
   ```
3. Triển khai Smart Contract:
   * **Cách A - Triển khai trên Hardhat Localhost (Khuyên dùng để kiểm thử nhanh, có sẵn ETH test):**
     * Mở một Terminal riêng khởi động node:
       ```powershell
       cd smart-contract
       npx hardhat node
       ```
     * Mở một Terminal khác để deploy và tự động xuất ABI:
       ```powershell
       cd smart-contract
       npm run deploy:local
       ```
   * **Cách B - Triển khai trên Sepolia Testnet:**
     * Tạo file `smart-contract/.env` dựa trên `.env.example`, điền `SEPOLIA_RPC_URL` và `SEPOLIA_PRIVATE_KEY`.
     * Chạy lệnh:
       ```powershell
       npm run deploy:sepolia
       ```

---

### BƯỚC 2: Khởi chạy Backend & Blockchain Listener (Khang)

1. Mở thư mục `backend`:
   ```powershell
   cd backend
   npm install
   ```
2. Kiểm tra/cấu hình file `backend/.env` (nếu cần đổi tài khoản MySQL):
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=mini_ecommerce_dapp
   BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
   ```
3. Khởi động Backend Server:
   ```powershell
   npm start
   ```
4. Kiểm tra thông báo log trên màn hình:
   * `✅ [MySQL] Successfully connected to database`
   * `👂 [Blockchain Listener] Successfully listening for 'PaymentCompleted' events!`

---

### BƯỚC 3: Khởi chạy Giao diện Frontend & Tương tác Web3 (Lưu Nhật Đông)

1. Mở thư mục `frontend`:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
2. Mở trình duyệt tại: `http://localhost:5173`
3. Cài đặt tiện ích mở rộng **MetaMask** trên trình duyệt:
   * **Nếu test trên mạng Localhost:** Thêm mạng tùy chỉnh với RPC `http://127.0.0.1:8545` (Chain ID: `31337`) và import 1 Private Key bất kỳ do Hardhat node sinh ra (có sẵn 10,000 ETH test).
   * **Nếu test trên mạng Sepolia:** Chọn mạng **Sepolia** trên MetaMask và nhận ETH testnet từ Sepolia Faucet.
4. Nhấn nút **"Kết nối ví MetaMask"** trên thanh điều hướng.
5. Thêm sản phẩm vào giỏ, bấm **"Đặt hàng & Thanh toán bằng Smart Contract"**:
   * Tiện ích MetaMask sẽ mở ra yêu cầu ký gửi số ETH tương ứng với đơn hàng.
   * Sau khi giao dịch được xác nhận trên Blockchain, Smart Contract sẽ emit sự kiện `PaymentCompleted`.
   * Backend Listener bắt được sự kiện và tự động cập nhật đơn hàng thành **`PAID` (Đã thanh toán)**.

---

## 🛡️ Kiểm thử tính năng Toàn vẹn & Chống gian lận

1. **Chống thanh toán lặp (Double-Payment):** Smart Contract kiểm tra `paidOrders[orderId]`. Nếu một đơn hàng đã từng thanh toán thành công, bất kỳ giao dịch thanh toán lại nào sẽ bị Contract từ chối (`revert`).
2. **Cơ chế Xóa mềm (Soft Delete):** Đơn hàng ở trạng thái `PENDING` (Chưa thanh toán) có thể được người dùng hủy bỏ, hệ thống chỉ cập nhật cờ `is_deleted = 1` và `status = 'CANCELLED'` chứ không xóa vĩnh viễn khỏi CSDL.
3. **Cơ chế Khóa hủy đơn:** Với đơn hàng đã có trạng thái `PAID` (tiền đã vào Smart Contract), mọi yêu cầu `DELETE /api/orders/:id` từ client sẽ bị Backend từ chối ngay lập tức với mã lỗi HTTP `400 Bad Request`:
   > *"Không thể hủy hoặc xóa đơn hàng đã thanh toán thành công trên Blockchain! Tiền đã được xác thực an toàn vào Smart Contract."*
