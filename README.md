# HỆ THỐNG HỖ TRỢ TÌM KIẾM VIỆC LÀM & THỰC TẬP CHO SINH VIÊN
> **ĐỒ ÁN 4 - TRƯỜNG ĐẠI HỌC SƯ PHẠM KỸ THUẬT HƯNG YÊN (UTEHY)**  
> **Sinh viên thực hiện**: Phạm Huy Anh - **Mã SV**: 12523003 - **Lớp**: 12523W.4  
> **Giảng viên hướng dẫn**: ThS. Nguyễn Hoàng Điệp  

---

## 🌟 Giới thiệu chung
Hệ thống là giải pháp toàn diện kết nối sinh viên có nhu cầu tìm kiếm việc làm, thực tập với các doanh nghiệp công nghệ hàng đầu (FPT Software, Viettel, VNG, MoMo, Rikkeisoft...), hỗ trợ quản trị viên trường theo dõi và kiểm duyệt tin tuyển dụng.

Hệ thống được phát triển bám sát 100% tài liệu phân tích nghiệp vụ, ca sử dụng (Use Case), biểu đồ thực thể (12 bảng MySQL) và giao diện trực quan:
- **Web Portal** (`web/`): React 19 + Ant Design + Vite
- **Back-end REST API** (`backend/`): Node.js + Express.js + MySQL 8.0 + JWT
- **Mobile App** (`mobile/`): React Native + Expo Router
- **Cơ sở dữ liệu**: MySQL (`job_system.sql`) với 12 bảng thực thể nghiệp vụ chặt chẽ.

---

---

## 🚀 Hướng dẫn khởi chạy nhanh

### Cách 1: Khởi chạy 1-Click (Khuyên dùng trên Windows)
Chỉ cần nháy đúp chuột vào file:
👉 **`start.bat`** (ngay tại thư mục gốc `d:\HeThongTimViecThucTap\start.bat`)
Hệ thống sẽ tự động bật cả Backend API (port 5000), Frontend Web Portal (port 3000) và tự mở trình duyệt web `http://localhost:3000`.

---

### Cách 2: Khởi chạy thủ công từng phần

#### 1. Cơ sở dữ liệu (MySQL Local)
Đảm bảo dịch vụ MySQL đang chạy tại cổng `3306`, cấu hình trong `backend/.env`:
- Database: `job_system` (Đã nạp đầy đủ 12 bảng thực thể nghiệp vụ)

#### 2. Khởi động Backend (Port 5000)
```bash
cd backend
npm install
npm start        # Khởi chạy server tại http://localhost:5000
```

#### 3. Khởi động Web Portal (Port 3000)
```bash
cd web
npm install
npm run dev      # Khởi chạy web tại http://localhost:3000
```

---

## 🔐 Tài khoản Đăng nhập & Phân quyền

| Vai trò | Email đăng nhập | Quyền hạn truy cập |
|---|---|---|
| **🎓 Sinh viên (Candidate)** | `phamhuyanh44@gmail.com` | Quản lý CV, nộp hồ sơ, lịch phỏng vấn, hồ sơ sinh viên |
| **🏢 Doanh nghiệp (FPT)** | `hr@fpt.com` | Đăng tin, duyệt hồ sơ ứng viên, xếp lịch phỏng vấn |
| **🛡️ Quản trị viên (Admin)** | `admin@utehy.edu.vn` | Bảng tin thống kê, duyệt tin, quản lý ngành nghề, khóa/mở khóa tài khoản |

> Ngoài ra, hệ thống hỗ trợ **Đăng ký tài khoản mới** (`/register`) lưu dữ liệu trực tiếp vào MySQL với mật khẩu được băm bảo mật (bcrypt).

---

## 📂 Danh mục chức năng đã hoàn thành

### 1. Phân hệ Sinh viên / Ứng viên (Candidate)
- 🔎 **Tìm kiếm & Lọc việc làm**: Tìm theo từ khóa, lọc đa tiêu chí theo ngành nghề, địa điểm (Hà Nội, Hưng Yên, TP.HCM...), loại hình (Thực tập, Toàn thời gian), khoảng lương.
- 📄 **Quản lý CV đa năng**: 
  - Tạo mới CV trực tuyến chuyên nghiệp với form chi tiết (Mục tiêu, Học vấn, Kỹ năng, Dự án).
  - **Tải lên tệp CV có sẵn (PDF / Word)** qua Multer API, lưu trữ an toàn và có cửa sổ **Xem trước (Preview) PDF trực tiếp** trên trình duyệt.
  - Hỗ trợ đánh dấu CV mặc định để nộp đơn nhanh.
- 📨 **Nộp đơn ứng tuyển**: Chọn CV (CV tạo online hoặc tệp PDF đã tải lên), gửi kèm thư giới thiệu (cover letter) trực tiếp tới nhà tuyển dụng.
- 📋 **Lịch sử & Tiến trình ứng tuyển**: Theo dõi trạng thái hồ sơ thời gian thực (`submitted`, `viewed`, `interview`, `accepted`, `rejected`) cùng phản hồi từ doanh nghiệp.
- 💖 **Việc làm đã lưu**: Đánh dấu tin tuyển dụng yêu thích và quản lý danh sách việc làm đã lưu.
- 📅 **Lịch phỏng vấn**: Xem thông tin buổi hẹn phỏng vấn, liên kết phòng họp trực tuyến (Google Meet/Zoom), xác nhận tham gia.
- ⭐ **Đánh giá & Xếp hạng Doanh nghiệp**: Sinh viên xem điểm đánh giá sao trung bình, biểu đồ tỷ lệ sao và nhận xét chi tiết; có thể gửi bài đánh giá & chấm điểm công ty trực tiếp.
- 🔔 **Thông báo & Email tự động**: Nhận thông báo trong hệ thống và Email tự động (Nodemailer) khi được mời phỏng vấn hoặc khi hồ sơ thay đổi trạng thái.
- 🔑 **Đổi mật khẩu tài khoản**: Tự đổi mật khẩu bảo mật ngay tại giao diện cá nhân.

### 2. Phân hệ Doanh nghiệp (Company)
- 📊 **Dashboard tuyển dụng**: Thống kê số tin đã đăng, tin đang tuyển, số lượng ứng viên nộp đơn, lịch phỏng vấn.
- 📝 **Quản lý tin tuyển dụng**: Đăng tin tuyển dụng mới với đầy đủ thông tin, chỉnh sửa, đóng/mở tin, xóa tin.
- 👥 **Quản lý ứng viên nộp đơn**: 
  - Xem danh sách ứng viên theo từng tin, lọc theo trạng thái hồ sơ.
  - Xem trực tiếp nội dung CV online hoặc mở xem trước tệp PDF tải lên của ứng viên.
  - **Xuất dữ liệu Excel (.xlsx)**: Xuất toàn bộ danh sách ứng viên nộp hồ sơ gồm thông tin liên hệ, vị trí ứng tuyển, trạng thái và ngày nộp.
- 🔄 **Cập nhật trạng thái ứng viên**: Phê duyệt hồ sơ (`Đã xem`, `Tiếp nhận thực tập`, `Từ chối`) kèm nhận xét phản hồi, tự động kích hoạt gửi Email thông báo đến sinh viên.
- 📆 **Xếp lịch phỏng vấn**: Tạo lịch phỏng vấn trực tuyến (Google Meet) hoặc trực tiếp, tự động lưu CSDL và gửi Email thông báo lịch hẹn tới ứng viên.

### 3. Phân hệ Quản trị viên (Admin)
- 📈 **Báo cáo - Thống kê**: Biểu đồ phân bố việc làm theo ngành nghề, biểu đồ trạng thái ứng tuyển, số lượng sinh viên và doanh nghiệp.
- 📊 **Xuất báo cáo Excel**: Xuất báo cáo tổng hợp hệ thống và cơ cấu việc làm theo ngành nghề ra file bảng tính Excel chuẩn xác.
- 🛡️ **Kiểm duyệt tin tuyển dụng**: Danh sách tin chờ duyệt (`pending`), duyệt tin (`approved`) hoặc từ chối (`rejected`) kèm lý do gửi cho doanh nghiệp.
- 👤 **Quản lý người dùng**: Xem danh sách tài khoản, tìm kiếm, lọc theo vai trò; khóa / mở khóa tài khoản vi phạm.
- 📑 **Xuất danh sách người dùng ra Excel**: Xuất toàn bộ danh mục tài khoản sinh viên và doanh nghiệp ra file Excel.
- 📂 **Quản lý danh mục ngành nghề**: Thêm mới, cập nhật, xóa danh mục lĩnh vực việc làm.

### 4. Phân hệ Ứng dụng Di động (Mobile App - React Native / Expo)
- 📱 Dành riêng cho Ứng viên / Sinh viên:
  - Đăng ký và đăng nhập tài khoản Sinh viên trực tiếp trên điện thoại.
  - Tìm kiếm và lọc việc làm, xem chi tiết tin tuyển dụng.
  - Nộp đơn ứng tuyển với CV trực tuyến.
  - Quản lý danh sách việc làm đã lưu.
  - Theo dõi danh sách hồ sơ CV đã tạo.
  - Quản lý lịch phỏng vấn và trạng thái ứng tuyển.
