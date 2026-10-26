# Web Portal – Hệ thống Tìm việc & Thực tập UTEHY

Giao diện web cho ba vai trò: sinh viên, doanh nghiệp và quản trị viên. Dùng React 19, Ant Design và Vite.

## Chạy

```bash
npm install
npm run dev      # http://localhost:3000, gọi API qua proxy tới backend ở cổng 5000
npm run build    # bản build trong dist/
npm run lint     # oxlint
```

Backend phải chạy trước (xem `../backend` và `../README.md`).

## Cấu trúc

- `src/api/`: `client.js` (axios, tự gắn JWT), `fileHelper.js` (tải CV có kiểm tra quyền).
- `src/context/AuthContext.jsx`: trạng thái đăng nhập.
- `src/pages/`: các trang theo vai trò, được tải theo route bằng `React.lazy`.
- `src/components/`: Navbar, Footer, thẻ việc làm, modal ứng tuyển.
