# HỆ THỐNG HỖ TRỢ TÌM KIẾM VIỆC LÀM & THỰC TẬP CHO SINH VIÊN
> **ĐỒ ÁN 4 - TRƯỜNG ĐẠI HỌC SƯ PHẠM KỸ THUẬT HƯNG YÊN (UTEHY)**  
> **Sinh viên thực hiện**: Phạm Huy Anh - **Mã SV**: 12523003 - **Lớp**: 12523W.4  
> **Giảng viên hướng dẫn**: ThS. Nguyễn Hoàng Điệp  

---

## 🌟 Giới thiệu chung
Hệ thống là giải pháp toàn diện kết nối sinh viên có nhu cầu tìm kiếm việc làm, thực tập với các doanh nghiệp công nghệ hàng đầu (FPT Software, Viettel, VNG, MoMo, Rikkeisoft...), hỗ trợ quản trị viên trường theo dõi và kiểm duyệt tin tuyển dụng.

Hệ thống được phát triển với kiến trúc tách biệt (Client-Server), bảo mật cao, kiểm thử tự động toàn diện và giao diện tối ưu:
- **Web Portal** (`web/`): React 19 + Vite + Ant Design (hỗ trợ Responsive, Lazy Loading, Dynamic Import Excel, Dark/Light theme chuẩn UTEHY)
- **Back-end REST API** (`backend/`): Node.js + Express.js + MySQL 8.0 + JWT + Zod Validation + Multer Upload an toàn
- **Mobile App** (`mobile/`): React Native + Expo SDK 54 / Expo Router + Expo SecureStore
- **Cơ sở dữ liệu**: MySQL (`job_system.sql`) với 12 bảng thực thể nghiệp vụ chuẩn hóa.

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy từ đầu

### 1. Chuẩn bị môi trường
- **Node.js** phiên bản `>= 18.x`
- **MySQL Server** phiên bản `>= 8.0` (đang chạy tại cổng `3306`)

---

### 2. Thiết lập Cơ sở dữ liệu MySQL
1. Mở MySQL client (HeidiSQL, MySQL Workbench, DBeaver hoặc dòng lệnh).
2. Tạo cơ sở dữ liệu `job_system` và nạp toàn bộ cấu trúc bảng từ file `job_system.sql`:
```sql
CREATE DATABASE IF NOT EXISTS job_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE job_system;
SOURCE d:/HeThongTimViecThucTap/job_system.sql;
```

---

### 3. Cấu hình Biến môi trường (`.env`)
1. Di chuyển vào thư mục `backend/`:
```bash
cd backend
cp .env.example .env
```
*(Trên Windows PowerShell: `Copy-Item .env.example .env`)*

2. Mở file `backend/.env` và thiết lập các thông số kết nối:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_SECURE_MYSQL_PASSWORD
DB_NAME=job_system

JWT_SECRET=your_jwt_secret_key_here
SEED_PASSWORD=YOUR_DEMO_SEED_PASSWORD
CORS_ORIGIN=http://localhost:3000
```
> [!IMPORTANT]
> - `SEED_PASSWORD`: Mật khẩu khởi tạo chung cho tất cả các tài khoản demo khi chạy script seed. Không để trống!
> - `CORS_ORIGIN`: Giới hạn chính xác nguồn gốc Web Portal kết nối vào API.

---

### 4. Cài đặt Thư viện & Khởi tạo Dữ liệu Demo (Seed an toàn)
1. Cài đặt các thư viện backend:
```bash
cd backend
npm install
```

2. Khởi tạo dữ liệu mẫu với cờ xác nhận an toàn `--yes`:
```bash
npm run seed -- --yes
```
> Script sẽ xác thực kết nối CSDL, làm sạch và nạp đầy đủ:
> - 1 Quản trị viên (`admin@utehy.edu.vn`)
> - 5 Doanh nghiệp công nghệ hàng đầu (FPT, Viettel, VNG, MoMo, Rikkeisoft)
> - 5 Sinh viên mẫu các chuyên ngành CNTT, KTPM, ATTT, Kinh tế số
> - Hàng chục tin tuyển dụng, đơn ứng tuyển, lịch hẹn phỏng vấn và đánh giá doanh nghiệp.
> - **Mật khẩu toàn bộ tài khoản được băm bcrypt từ biến `SEED_PASSWORD` bạn đã cấu hình.**

---

### 5. Chạy Bộ Kiểm Thử Tự Động Toàn Diện (Automated Tests)
Hệ thống tích hợp quy trình kiểm thử hoàn toàn tự động, tự khởi tạo CSDL test độc lập `job_system_test` và đảm bảo **không làm thay đổi bất kỳ dòng dữ liệu nào trên CSDL phát triển (`job_system`)**:
```bash
cd backend
npm test
```
> Toàn bộ các ca kiểm thử bảo mật CV, kiểm tra quyền duyệt tin, chống IDOR, Zod validation, xác thực JWT và kiểm tra dữ liệu sẽ được thực thi và báo cáo kết quả chi tiết.

---

### 6. Khởi chạy Ứng dụng

#### Cách 1: Khởi chạy 1-Click bằng `start.bat` (Khuyên dùng)
Tại thư mục gốc dự án:
👉 Chạy file **`start.bat`**  
Script sẽ tự động khởi động đồng thời Backend API (port 5000), Web Portal (port 3000) và tự động mở trình duyệt web `http://localhost:3000`.

#### Cách 2: Khởi chạy thủ công từng phần

**Khởi chạy Backend API (Port 5000):**
```bash
cd backend
npm start
```

**Khởi chạy Web Portal (Port 3000):**
```bash
cd web
npm install
npm run dev
```

**Khởi chạy Mobile App (Expo Go):**
```bash
cd mobile
npm install
npx expo start
```

---

## 🔐 Danh sách Tài khoản Mẫu (Khởi tạo theo `SEED_PASSWORD`)

| Vai trò | Email đăng nhập | Đại diện / Đơn vị | Quyền hạn truy cập |
|---|---|---|---|
| **🛡️ Quản trị viên** | `admin@utehy.edu.vn` | Quản trị viên UTEHY | Thống kê số liệu, duyệt tin tuyển dụng, quản trị ngành nghề, khóa/mở khóa tài khoản |
| **🏢 Doanh nghiệp** | `hr@fpt.com` | FPT Software | Đăng tin, duyệt hồ sơ ứng viên, xếp lịch phỏng vấn, xuất danh sách ứng viên Excel |
| **🏢 Doanh nghiệp** | `hr@viettel.com.vn` | Viettel Digital | Đăng tin, duyệt hồ sơ ứng viên, xếp lịch phỏng vấn, xuất danh sách ứng viên Excel |
| **🏢 Doanh nghiệp** | `tuyendung@vng.com.vn` | VNG Corporation | Đăng tin, duyệt hồ sơ ứng viên, xếp lịch phỏng vấn, xuất danh sách ứng viên Excel |
| **🏢 Doanh nghiệp** | `careers@momo.vn` | MoMo | Đăng tin, duyệt hồ sơ ứng viên, xếp lịch phỏng vấn, xuất danh sách ứng viên Excel |
| **🏢 Doanh nghiệp** | `career@rikkeisoft.com` | Rikkeisoft | Đăng tin, duyệt hồ sơ ứng viên, xếp lịch phỏng vấn, xuất danh sách ứng viên Excel |
| **🎓 Sinh viên** | `phamhuyanh44@gmail.com` | Sinh viên CNTT | Tìm kiếm việc làm, tạo/tải CV, nộp đơn, lịch phỏng vấn, đánh giá công ty |
| **🎓 Sinh viên** | `nguyenvanan@utehy.edu.vn` | Sinh viên KTPM | Tìm kiếm việc làm, tạo/tải CV, nộp đơn, lịch phỏng vấn, đánh giá công ty |
| **🎓 Sinh viên** | `tranthimai@utehy.edu.vn` | Sinh viên Kinh tế số | Tìm kiếm việc làm, tạo/tải CV, nộp đơn, lịch phỏng vấn, đánh giá công ty |
| **🎓 Sinh viên** | `lequangminh@utehy.edu.vn` | Sinh viên ATTT | Tìm kiếm việc làm, tạo/tải CV, nộp đơn, lịch phỏng vấn, đánh giá công ty |
| **🎓 Sinh viên** | `hoangthao@utehy.edu.vn` | Sinh viên UI/UX | Tìm kiếm việc làm, tạo/tải CV, nộp đơn, lịch phỏng vấn, đánh giá công ty |

> Mật khẩu ban đầu của tất cả tài khoản mẫu là giá trị biến `SEED_PASSWORD` bạn đã đặt khi chạy lệnh seed.
> Bạn có thể đăng ký tài khoản mới trực tiếp tại màn hình Đăng ký của Web Portal hoặc Mobile App.

---

## 📌 Hướng dẫn dành cho Quản trị viên & Nhà phát triển

### Những việc cần chủ động thực hiện khi triển khai Production:
1. **Đổi mật khẩu MySQL Root**: Đảm bảo mật khẩu root MySQL trên máy chủ máy phát triển/máy chủ thật đủ mạnh và khác với lịch sử git cũ.
2. **Đổi mật khẩu tài khoản Admin**: Sau khi chạy seed lần đầu, đăng nhập tài khoản `admin@utehy.edu.vn` và thực hiện đổi mật khẩu ngay tại trang cá nhân.
3. **Đưa mã nguồn lên Git Remote**:
```bash
git push origin main
```

---

## 📋 Báo Cáo Nghiệm Thu & Đánh Giá Toàn Diện Hệ Thống (Review)

| STT | Phân hệ / Hạng mục | Hiện trạng sau nâng cấp | Đánh giá |
|:---:|:---|:---|:---:|
| **1** | **Bảo mật Tệp CV (Ưu tiên 1)** | Xoá CV trong DB đồng thời xoá file vật lý trên đĩa; `serveCVFile` so khớp chính xác đường dẫn `/uploads/cvs/<filename>`, chặn tuyệt đối truy cập file đã xoá (404); `createCV`/`updateCV` chỉ nhận đường dẫn từ route upload. | **ĐẠT (100%)** |
| **2** | **Bảo mật Tin Đã Lưu (Ưu tiên 1)** | `toggleSaveJob` chỉ cho phép lưu tin đã duyệt (`approved`), tin chưa duyệt trả 404; `getSavedJobs` giấu nội dung chi tiết của các tin bị gỡ hoặc chờ duyệt. | **ĐẠT (100%)** |
| **3** | **Bảo vệ Token & Email (Ưu tiên 2)** | `serveCVFile` bỏ nhận token qua `?token=`, dùng Authorization header; Web tải file bằng `Blob URL` an toàn; `emailService` tự động escape href phòng XSS và không escape tiêu đề email. | **ĐẠT (100%)** |
| **4** | **Backend Hardening (Ưu tiên 3)** | Bổ sung Zod Schema Validation cho toàn bộ route ghi; transaction rollback chuẩn xác; handler lỗi Multer tiếng Việt; lỗi 500 trả "Lỗi hệ thống máy chủ" không lộ trace; CORS cấu hình theo biến môi trường; ràng buộc UNIQUE cho đánh giá công ty; `crypto.randomUUID()` cho Firebase UID. | **ĐẠT (100%)** |
| **5** | **Test & Seed An toàn (Ưu tiên 4)** | `seed.js` yêu cầu cờ `--yes` và bắt buộc `SEED_PASSWORD`, không in mật khẩu ra log; `npm test` tự động clone schema sang DB riêng `job_system_test`, verify DB dev giữ nguyên 100%. | **ĐẠT (100%)** |
| **6** | **Giao diện Web Portal (Ưu tiên 5)** | Thiết kế Responsive hoàn chỉnh với Mobile Drawer; toàn bộ 9 Table có `scroll={{ x: true }}`; xử lý báo lỗi người dùng kèm nút "Thử lại"; trang 404 chuẩn; hỗ trợ sửa CV online & upload avatar; dọn sạch thông tin hardcode; code-splitting bằng `React.lazy` và Dynamic Import `xlsx` (không còn cảnh báo chunk lớn); **0 lint warnings / 0 errors**. | **ĐẠT (100%)** |
| **7** | **Ứng dụng Mobile App (Ưu tiên 6)** | `toggleSaveJob` tích hợp nút Lưu/Bỏ lưu tin thời gian thực; bộ lọc địa điểm; quản lý đầy đủ 5 trạng thái lịch phỏng vấn kèm nút Từ chối; bảo mật Access Token bằng `expo-secure-store`; tự động đăng xuất khi 401; kiểm tra kiểu TypeScript 0 lỗi (`npx tsc --noEmit`). | **ĐẠT (100%)** |
