# Sửa cụm lỗi xác thực

Mục tiêu: chỉ đăng nhập được bằng JWT hợp lệ, có được JWT thì phải đúng email + mật khẩu. Không còn đường tắt nào.

## Hiện trạng (đã kiểm tra trong code)
- `backend/middlewares/auth.js:24-27, 77-79`: không có token thì tin header `x-user-id`, gửi `x-user-id: 1` là thành admin.
- `web/src/api/client.js:20-27`: web lần nào cũng gửi header `x-user-id`.
- `backend/controllers/authController.js:57`: login không gửi mật khẩu thì bỏ qua bước kiểm tra.
- `authController.js:59` và `:285`: `'123456'` là mật khẩu vạn năng cho login và đổi mật khẩu.
- `authController.js:139, 164` và `mobile/src/services/api.ts:94`: đăng ký không gửi mật khẩu thì mặc định là `'123456'`.
- `authController.js:283`: đổi mật khẩu không gửi `currentPassword` vẫn đổi được.
- `routes/authRoutes.js:7` + `authController.js:82-130`: `/auth/demo-login` công khai và trả JWT của mọi vai trò, kể cả admin.
  - Chỉ còn một chỗ dùng: `web/src/components/ApplyModal.jsx:106` (gọi `switchRole('candidate')` qua `AuthContext.jsx:79`).
- `web/src/components/Navbar.jsx:96-120`: modal đăng nhập/đăng ký chỉ gửi email, không có ô mật khẩu (bản này đang dựa vào lỗ hổng ở trên).
- `middlewares/auth.js:4`: JWT secret có giá trị dự phòng viết cứng.
- `config/db.js:7`: mật khẩu MySQL thật nằm trong code.
- `backend/.env` và 1261 file `backend/node_modules` đang được git theo dõi; `backend/.gitignore` rỗng, thư mục gốc không có `.gitignore`.
- Ba tài khoản hiện có trong DB đều đã có mật khẩu hash, nên bỏ đường tắt sẽ không khoá ai ra ngoài.

## Kế hoạch

### Backend
- [x] `middlewares/auth.js`: xoá nhánh `x-user-id` ở `authenticate` và `optionalAuth`.
- [x] `middlewares/auth.js`: bỏ fallback JWT secret; thiếu `JWT_SECRET` thì server dừng ngay khi khởi động, có báo lỗi rõ ràng.
- [x] `authController.login`:
  - Bắt buộc có email và mật khẩu (thiếu thì trả 400).
  - Bỏ `'123456'`.
  - Sai email hoặc sai mật khẩu đều trả 401 với cùng một thông báo, để không lộ email nào có tồn tại.
- [x] `authController.register`: bắt buộc có mật khẩu, tối thiểu 6 ký tự; bỏ giá trị mặc định `'123456'`.
- [x] `authController.changePassword`: bắt buộc nhập `currentPassword` đúng; bỏ `'123456'`.
- [x] Xoá route `/auth/demo-login` và hàm `demoLogin`.
- [x] `config/db.js`: bỏ mật khẩu MySQL viết cứng.

### Web
- [x] `api/client.js`: không gửi `x-user-id` nữa.
- [x] `AuthContext.jsx`: xoá `switchRole`.
- [x] `ApplyModal.jsx`: khách chưa đăng nhập thì có nút "Đăng nhập để ứng tuyển", chuyển sang `/login`.
- [x] `Navbar.jsx`: nút Đăng nhập/Đăng ký chuyển sang trang `/login` và `/register` sẵn có (hai trang này đã có ô mật khẩu); bỏ modal chỉ có ô email.
- [x] `ProtectedRoute.jsx`: bỏ biến `switchRole` không dùng.

### Mobile
- [x] `services/api.ts:94`: không gửi mật khẩu mặc định `'123456'`.

### Git
- [x] Thêm `.gitignore` ở thư mục gốc: `node_modules/`, `.env`, `dist/`, `.expo/`, `backend/uploads/`.
- [x] `git rm --cached` cho `backend/.env` và `backend/node_modules` (file vẫn còn trên máy).
- [x] Thêm `backend/.env.example` (chỉ có tên biến, không có giá trị).
- [x] Đổi `JWT_SECRET` trong `.env` sang chuỗi ngẫu nhiên mới, vì chuỗi cũ đã nằm trong lịch sử git.
- [ ] Bạn tự đổi mật khẩu MySQL root (mật khẩu cũ đã lộ trong lịch sử git), rồi cập nhật `.env`.
- Không tự commit hay push, và không viết lại lịch sử git.

### README
- [x] Bỏ dòng nói về Quick Switcher và cụm "mật khẩu mặc định".
- [x] Cập nhật đúng email các tài khoản demo đang có trong DB.

## Kiểm chứng
Chạy backend rồi gọi bằng curl:
- [x] Gọi `/api/auth/me` chỉ với `x-user-id: 1` → phải nhận 401.
- [x] Login không có mật khẩu → phải nhận 400.
- [x] Login với mật khẩu `123456` sai → phải nhận 401.
- [x] Login đúng mật khẩu → nhận 200 và token; dùng token gọi `/auth/me` → 200.
- [x] `POST /auth/demo-login` → phải nhận 404.
- [x] Đổi mật khẩu thiếu hoặc sai `currentPassword` → phải nhận 400.
- [x] `npm run build` ở `web/` chạy được; `npx tsc --noEmit` ở `mobile/` không lỗi.
- [x] Trên trình duyệt: đăng nhập, ứng tuyển khi chưa đăng nhập (phải chuyển sang `/login`), đăng xuất.
- [x] `git status`: không còn thấy `.env` và `node_modules`.

## Ngoài phạm vi (làm ở lượt sau)
- IDOR ở applications, interviews, CV, duyệt tin.
- Lỗ hổng upload.
- Schema thiếu cột `users.password` và bảng `company_reviews`.
- Seed lại dữ liệu demo.
