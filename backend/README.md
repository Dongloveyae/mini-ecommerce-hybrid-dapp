# Mini E-Commerce Hybrid DApp — Phân Hệ Backend & Blockchain Event Listener

**Kỹ sư phụ trách:** Khang (Member 2 - Backend & Blockchain Integration Engineer)  
**Email:** ntakhanghttt2311013@student.ctuet.edu.vn  
**Công nghệ:** Node.js, Express.js, MySQL2, Ethers.js (v6), JSON Web Token (JWT), Multer, Bcryptjs.

---

## 1. Kiến Trúc Tổng Quan (Hybrid DApp Architecture)

Phân hệ Backend đóng vai trò "Trục xương sống" kết nối giữa **Cơ sở dữ liệu Off-chain (MySQL)** và **Mạng lưới Blockchain On-chain (Ethereum Sepolia)**:
- **Off-chain (MySQL):** Đáp ứng tốc độ cao (millisecond), CRUD linh hoạt cho người dùng, danh mục, sản phẩm, giỏ hàng và chi tiết đơn hàng mà không tốn phí Gas.
- **On-chain (Smart Contract Sepolia):** Minh bạch hóa tài chính, chống làm giả thanh toán và đảm bảo tính bất biến (Immutability).
- **Trục kết nối:** Module `blockchainListener.js` đóng vai trò Daemon Service lắng nghe thời gian thực các sự kiện từ Smart Contract để đối soát và tự động khóa/mở đơn hàng.

```
[ Khách hàng ] ──(Duyệt hàng & Đặt đơn)──> [ Express Backend ] ──(Tạo đơn & Lock kho)──> [ MySQL DB ]
      │                                                                                        ▲
      ├──(Ký thanh toán ETH trên MetaMask)──> [ Smart Contract Sepolia ]                       │
                                                      │ (Emit PaymentCompleted)                │
                                                      ▼                                        │
                                           [ Blockchain Listener ] ──(Kiểm toán & Đổi PAID)────┘
```

---

## 2. Các Nâng Cấp Kỹ Thuật & Giải Pháp An Ninh Trọng Yếu (Bởi Kỹ sư Khang)

Trong quá trình rà soát và hoàn thiện hệ thống, phân hệ Backend đã được gia cố với 6 tiêu chuẩn kỹ thuật cấp độ Production:

### 🛡️ 1. Kiểm Toán Bảo Mật Tài Chính On-chain (Chống gian lận 1 wei)
- **Vấn đề:** Trước đây, khi sự kiện `PaymentCompleted` bắn về, hệ thống chỉ kiểm tra `orderId` tồn tại rồi lập tức duyệt `PAID`. Kẻ tấn công có thể gọi trực tiếp hàm Smart Contract và nạp `1 wei` (0.000000000000000001 ETH) để chiếm đoạt đơn hàng tiền triệu.
- **Giải pháp:** Backend tích hợp thuật toán so sánh số tiền nạp:
  $$PaidEth \ge ExpectedEth - \epsilon$$
  Nếu phát hiện nạp thiếu tiền, hệ thống lập tức chuyển đơn hàng sang trạng thái cảnh báo `PAYMENT_MISMATCH` và ghi log kiểm toán.

### 🔄 2. Giải Quyết Xung Đột Tồn Kho (Race Condition trên Đơn Hàng Thanh Toán Trễ)
- **Vấn đề:** Khách hàng hủy đơn PENDING (hệ thống đã cộng trả lại hàng vào kho). Nhưng giao dịch MetaMask của khách đã gửi đi từ trước và vừa được thợ đào đóng khối thành công.
- **Giải pháp:** Khi `blockchainListener` nhận được event nạp tiền cho đơn hàng đã bị `CANCELLED`, hệ thống tự động kích hoạt **Database Transaction** để **trừ lại số lượng tồn kho tương ứng**, khôi phục đơn sang `PAID` và khóa đơn vĩnh viễn, triệt tiêu hoàn toàn lỗi lệch kho thực tế.

### 🔒 3. Xác Thực Chống Giả Mạo Mã Băm Giao Dịch (`/api/blockchain/verify-payment`)
- **Vấn đề:** Kẻ xấu có thể gửi một `txHash` của bất kỳ giao dịch thành công nào trên mạng Sepolia (như chuyển tiền cho bạn bè) để lừa backend duyệt đơn.
- **Giải pháp:** Hàm `verifyAndSyncPayment` bắt buộc kiểm tra địa chỉ người nhận `receipt.to.toLowerCase() === contractAddress.toLowerCase()` và xác minh logs biên nhận xuất phát từ chính Smart Contract cửa hàng.

### 🔢 4. Triệt Tiêu Lỗi Sai Lệch Số Thực JavaScript (Floating Point Precision)
- **Vấn đề:** Trong JS, phép cộng số thực `0.1 + 0.2 = 0.30000000000000004`. Khi cộng dồn đơn giá ETH của nhiều sản phẩm lẻ có thể sinh ra sai lệch vài wei so với số tiền trên MetaMask.
- **Giải pháp:** Toàn bộ phép tính tiền trong `orderController` được chuyển đổi sang đơn vị **BigInt Wei** thông qua `ethers.parseEther()` trước khi lưu trữ, đảm bảo độ chuẩn xác 100%.

### 👤 5. Triệt Tiêu Lỗ Hổng Lộ Hash Mật Khẩu (CWE-200) & Phân Quyền Sở Hữu
- **Giải pháp:** Loại bỏ hoàn toàn trường `password` khỏi các câu truy vấn `getAllUsers` và `getUserById`.
- Bổ sung middleware `extractUser` và kiểm tra quyền sở hữu đơn hàng: Người dùng chỉ được phép xem và thao tác trên đơn hàng của chính mình (hoặc Admin).

### 🌐 6. Khả Năng Tự Phục Hồi Kết Nối RPC (Self-Healing Daemon)
- Tích hợp cơ chế tự động kết nối lại (Auto-reconnect with Backoff) khi RPC Sepolia công cộng bị nghẽn (HTTP 429 Too Many Requests) hoặc timeout, đi kèm bộ bắt lỗi Unhandled Rejection toàn cục giúp server không bao giờ bị sập đột ngột (Zero Downtime).

---

## 3. Danh Sách RESTful API Chi Tiết

| Phương thức | Endpoint | Chức năng | Phân quyền |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Đăng ký tài khoản khách hàng mới | Public |
| `POST` | `/api/auth/login` | Đăng nhập hệ thống, cấp JWT Token | Public |
| `GET` | `/api/auth/me` | Lấy hồ sơ tài khoản hiện tại | Yêu cầu Token |
| `GET` | `/api/products` | Lấy danh sách sản phẩm cửa hàng | Public |
| `GET` | `/api/products/:id` | Xem chi tiết 1 sản phẩm | Public |
| `POST` | `/api/products` | Thêm mới sản phẩm | Admin |
| `PUT` | `/api/products/:id` | Cập nhật thông tin sản phẩm | Admin |
| `PATCH`| `/api/products/:id/toggle-visibility` | Chuyển đổi Ẩn / Hiện sản phẩm | Admin |
| `GET` | `/api/cart/:userId?` | Lấy giỏ hàng theo người dùng | Public / User |
| `POST` | `/api/cart` | Thêm vào giỏ (kiểm tra tồn kho & số lượng dương) | Public / User |
| `PUT` | `/api/cart/:id` | Cập nhật số lượng giỏ hàng | Public / User |
| `DELETE`| `/api/cart/item/:id` | Xóa mặt hàng khỏi giỏ | Public / User |
| `GET` | `/api/orders` | Danh sách đơn hàng (hỗ trợ lọc userId, status) | Public / User |
| `GET` | `/api/orders/:id` | Xem chi tiết đơn hàng và dòng hàng | Public / User |
| `POST` | `/api/orders` | Tạo đơn hàng (Lock kho `FOR UPDATE`, tính tiền Wei) | Public / User |
| `DELETE`| `/api/orders/:id` | Xóa mềm đơn hàng (Hoàn kho, chống xóa đơn PAID) | User / Admin |
| `PATCH`| `/api/orders/:id/restore`| Khôi phục đơn hàng đã hủy (Trừ lại kho) | Admin |
| `POST` | `/api/blockchain/verify-payment` | Xác thực đối soát tức thì mã băm giao dịch Sepolia | Public |
| `GET` | `/api/health` | Kiểm tra trạng thái máy chủ, CSDL và RPC Sepolia | Public |
| `GET` | `/api/admin/stats` | Thống kê tổng doanh thu ETH, số đơn và khách hàng | Admin |
| `POST` | `/api/upload` | Tải ảnh sản phẩm (Multer giới hạn 10MB) | Admin |

---

## 4. Hướng Dẫn Khởi Chạy Kiểm Thử

1. Bật dịch vụ **MySQL** trong **XAMPP Control Panel**.
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Khởi tạo cơ sở dữ liệu mẫu:
   ```bash
   npm run init-db
   ```
4. Khởi động máy chủ Backend:
   ```bash
   npm start
   ```
5. Mở trình duyệt kiểm tra: `http://localhost:5000/api/health`
