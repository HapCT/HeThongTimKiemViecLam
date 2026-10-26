# 📱 UTEHY Job Portal - Ứng dụng Di động Tìm Việc & Thực Tập Sinh Viên

Ứng dụng di động dành cho sinh viên Đại học Sư phạm Kỹ thuật Hưng Yên (UTEHY), hỗ trợ tìm kiếm cơ hội thực tập, việc làm CNTT & kỹ thuật, lưu tin yêu thích, nộp hồ sơ CV và quản lý lịch hẹn phỏng vấn doanh nghiệp trực tuyến.

---

## ✨ Tính Năng Nổi Bật

1. **Khám Phá & Tìm Kiếm Việc Làm:**
   - Tra cứu theo từ khóa, ngành nghề đào tạo, hình thức việc làm (Thực tập / Toàn thời gian).
   - Bộ lọc địa điểm: Hà Nội, Hưng Yên, TP. Hồ Chí Minh, Đà Nẵng, Bắc Ninh, Hải Phòng,...
   - Xem chi tiết thông tin công ty, mức lương, số lượng tuyển, mô tả công việc, yêu cầu và quyền lợi.

2. **Lưu Việc Làm Yêu Thích:**
   - Lưu hoặc bỏ lưu tin tuyển dụng tức thì ngay trên thẻ công việc hoặc trong màn hình chi tiết.
   - Đồng bộ danh sách tin đã lưu với tài khoản ứng viên.

3. **Ứng Tuyển Nhanh Chóng:**
   - Sử dụng CV trực tuyến hoặc CV đã tải lên trên hệ thống Web.
   - Đính kèm thư giới thiệu (Cover Letter) gửi trực tiếp tới nhà tuyển dụng.

4. **Quản Lý Lịch Hẹn Phỏng Vấn:**
   - Cập nhật thời gian thực các trạng thái: Chờ xác nhận, Đã xác nhận, Đã từ chối, Đã hủy, Đã hoàn thành.
   - Thao tác một chạm: Xác nhận tham gia hoặc Từ chối lịch phỏng vấn.
   - Mở trực tiếp phòng họp trực tuyến Google Meet.

5. **Hồ Sơ & Bảo Mật:**
   - Quản lý thông tin ứng viên, xem danh sách CV và việc làm đã lưu.
   - Bảo mật Access Token bằng **Expo SecureStore** (chuẩn mã hóa Keychain trên iOS và Keystore trên Android).
   - Tự động đăng xuất và dọn sạch phiên làm việc khi token hết hạn hoặc lỗi xác thực (HTTP 401).
   - Xử lý mạng linh hoạt với thời gian chờ (timeout) và thông báo lỗi tiếng Việt thân thiện.

---

## 🛠️ Công Nghệ Sử Dụng

- **Framework:** React Native + Expo SDK 54 / Expo Router (file-based routing)
- **Ngôn ngữ:** TypeScript
- **Bảo mật:** `expo-secure-store`
- **Giao diện:** React Native Components tối ưu UI/UX, hỗ trợ SafeArea và StatusBar

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu cầu môi trường
- Node.js >= 18.x
- Ứng dụng **Expo Go** trên thiết bị di động (Android / iOS) hoặc máy ảo / Android Studio

### 2. Cài đặt thư viện
```bash
cd mobile
npm install
```

### 3. Cấu hình địa chỉ máy chủ API
Mở file `src/services/api.ts` và đảm bảo biến `API_BASE` trỏ đúng địa chỉ IP máy chủ của bạn (nếu chạy qua Expo Go trên điện thoại cùng mạng Wi-Fi):
```typescript
// Ví dụ khi chạy trên thiết bị thật cùng mạng Wi-Fi:
export const API_BASE = 'http://192.168.1.100:5000/api';

// Mặc định cho máy ảo Android:
// export const API_BASE = 'http://10.0.2.2:5000/api';
```

### 4. Khởi chạy ứng dụng
```bash
npx expo start
```
- Quét mã QR bằng ứng dụng **Expo Go** (trên Android) hoặc **Camera** (trên iOS).
- Hoặc nhấn phím `a` để mở trên Android Emulator, `w` để mở trên Web.

### 5. Kiểm tra mã nguồn (Type-check)
```bash
npx tsc --noEmit
```
Đảm bảo 0 lỗi kiểu dữ liệu trước khi đóng gói sản phẩm.
