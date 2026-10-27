# Kế hoạch sửa toàn bộ dự án

Làm lần lượt theo thứ tự ưu tiên bên dưới. Xong giai đoạn nào thì kiểm chứng, đánh dấu, rồi mới commit (commit khi bạn đồng ý).
Kiểm tra lại ngày 26/10/2026 trên một DB tạo mới từ `job_system.sql`: seed chạy sạch, `npm test` 19/19, web build được, mobile `tsc` không lỗi.
Dấu [x] dưới đây chỉ dành cho mục đã được đối chiếu trong code hoặc đã chạy thử.

---

## ✅ Chatbot gợi ý việc làm (làm ngày 27/10, đã chạy thật với Gemini, chưa commit)
Đã chốt: gợi ý việc làm từ bảng `jobs`; dùng Gemini API; có trên web và mobile; ai cũng dùng được (kể cả khách); không lưu lịch sử vào CSDL; chưa có API key.

**Cách hoạt động:** người dùng gõ câu hỏi → backend gửi câu đó cho Gemini kèm một hàm `search_jobs` (từ khoá, địa điểm, loại hình, lương tối thiểu). Gemini tự quyết định tham số, backend chạy truy vấn thật (chỉ tin `approved`, chưa hết hạn, chưa xoá), trả kết quả lại cho Gemini viết câu trả lời. API trả về `{ reply, jobs: [...] }` để giao diện hiện thẻ tin có link. Bot không tự bịa tin, vì danh sách tin luôn lấy từ CSDL.

### Backend
- [x] Cài `@google/genai` 2.31; thêm `GEMINI_API_KEY`, `GEMINI_MODEL` (mặc định `gemini-flash-latest`) vào `.env.example`.
- [x] Tách phần dựng điều kiện lọc của `jobController.getJobs` thành `services/jobSearch.js` (`buildJobFilters`); trang tìm việc và chatbot dùng chung.
- [x] `services/chatbotService.js`: lời dặn hệ thống, hàm `search_jobs`, tối đa 3 lượt gọi hàm (lượt cuối tắt tools để model buộc phải trả lời); lọc lại tham số model gửi (`sanitizeSearchArgs`); mỗi lần tìm tối đa 5 tin.
- [x] `POST /api/chatbot`: zod kiểm `messages` (1–20 tin, mỗi tin 1–1000 ký tự, tin cuối phải của người dùng); chỉ gửi 10 tin gần nhất; rate limit riêng 20 lượt/15 phút/IP. Thiếu key → 503; Gemini lỗi → 502.
  - Khác kế hoạch: không gắn `optionalAuth` vì chatbot không dùng thông tin người dùng.
- [x] `run_tests.js`: server test chạy với `GEMINI_API_KEY` rỗng (không tốn tiền, kết quả ổn định kể cả khi `.env` đã có key); tiến trình test dùng `DB_NAME` của DB test.

### Web
- [x] `components/ChatbotWidget.jsx`: nút nổi góc phải dưới, khung chat 380px, 3 câu gợi ý, thẻ việc làm bấm vào mở `/jobs/:id`; timeout riêng 30 giây. Gắn trong `App.jsx`.

### Mobile
- [x] Tab "Trợ lý" (`src/app/chatbot.tsx`), hàm `sendChatMessage` trong `api.ts` (`request` nhận thêm tham số timeout, mặc định vẫn 15 giây). Bấm thẻ việc làm → chuyển về tab Việc làm kèm `jobId`, tab đó tự mở modal chi tiết.

### Kiểm chứng
- [x] Backend `npm test`: 51/51 (40 cũ + 11 mới trong `tests/chatbot.test.js`): chỉ trả tin approved/còn hạn/chưa xoá; tìm đúng tên tin pending vẫn không lộ; lọc loại hình + địa điểm; bỏ tham số sai từ model; vòng gọi hàm với Gemini giả (có gọi hàm, không gọi hàm, gọi mãi thì dừng sau 3 lượt); API 400 ×3 và 503.
- [x] Web: `npm run build` được; lint vẫn 28 cảnh báo như trước, file mới không có cảnh báo.
- [x] Mobile: `npx tsc --noEmit` không lỗi; `npx expo export --platform android` đóng gói được.
- [x] Trình duyệt (web của bạn ở cổng 3000, backend cổng 5000): mở khung chat, bấm câu gợi ý → hiện "Chatbot chưa được cấu hình trên máy chủ". Giả lập phản hồi `/chatbot` bằng 3 tin thật → thẻ hiển thị đúng, tự cuộn xuống cuối, bấm thẻ mở `/jobs/2`.
- [x] Đã có key trong `backend/.env` (file bị git bỏ qua). Chạy thật với Gemini: "Tìm thực tập React ở Hà Nội" → 4,2 giây, trả đúng tin số 1 (FPT, thực tập, Hà Nội); "bán thời gian lương từ 5 triệu" → 4,8 giây, báo không có tin và gợi ý nới điều kiện (đối chiếu CSDL: đúng là không có tin part_time nào).
- [x] Sửa sau khi chạy thật:
  - `gemini-flash-latest` hay báo 503 quá tải, các bản 2.5 đã ngừng cấp cho người dùng mới (404). Model mặc định đổi thành `gemini-flash-lite-latest`.
  - SDK mặc định tự thử lại 5 lần nên lần gọi đầu treo hơn 90 giây. Đổi thành không thử lại, tối đa 15 giây mỗi lần gọi, để người dùng nhận thông báo "Trợ lý đang bận" (502).
- [x] Đổi sang key mới (key cũ hết 500 lượt/ngày của gói miễn phí). Chạy thật ngày 27/10:
  - Qua API: "Tester" → báo không có tin; đúng, vì tin Tester duy nhất (id 13) đang chờ duyệt. "Thủ đô của Pháp" → từ chối lịch sự. "Thực tập ở Hưng Yên" → tin 12 Rikkeisoft, 3 giây.
  - Trên web: "Tìm thực tập React ở Hà Nội" → thẻ tin FPT; hỏi nối tiếp "Còn vị trí nào khác ở Hà Nội?" → 5 tin, nghĩa là bot nhớ ngữ cảnh hội thoại.
- [x] Sửa sau khi chạy thật lần 2:
  - Thời gian Gemini trả lời dao động 1–27 giây mỗi lượt gọi. Giới hạn nâng lên 30 giây mỗi lượt; web/mobile chờ tối đa 70 giây.
  - Bot viết markdown (`**...**`) mà giao diện hiện nguyên văn. Đã thêm lời dặn "văn bản thuần, không markdown". Lần đầu viết "chữ thường" thì model hiểu thành viết thường toàn bộ; đã sửa câu dặn, kiểm lại: viết hoa và ghi số bình thường.
- [ ] Gemini gói miễn phí chập chờn: có lúc trả 503/hết giờ, khi đó bot báo "Trợ lý đang bận", đúng như thiết kế. Hỏi lại sau ít phút là được.
- [ ] Hai key đã lộ trong lịch sử chat: nên tạo key mới ở AI Studio, thay vào `.env`, xoá hai key cũ.
- Kiểm lại sau thay đổi: backend 51/51, web build được, mobile `tsc` không lỗi.
- [ ] Chưa chạy tab Trợ lý trên Expo Go.
- Ngoài phạm vi: cập nhật báo cáo Word (đợt trước đã bỏ chữ "chatbot" khỏi báo cáo); làm khi chatbot chạy thật.

### Review
- Chatbot không viết SQL riêng: dùng chung `buildJobFilters` với trang tìm việc, nên quy tắc "khách chỉ thấy tin approved còn hạn" chỉ nằm một chỗ.
- Không tin dữ liệu model trả về: tham số được lọc lại trước khi vào truy vấn, danh sách tin trả cho giao diện lấy từ CSDL chứ không từ chữ model viết.
- ✅ Đã sửa (27/10): ở màn hình 375px cả site tràn ngang tới 527px, đẩy khung chat lệch phải.
  - Nguyên nhân 1, ở `Navbar.jsx`: header điện thoại xếp logo, nhãn "Việc Làm & Thực Tập", Đăng nhập, Đăng ký, nút menu, đều không co. Sửa: thêm `desktop-only` cho nhãn, nút Đăng ký, thẻ tên người dùng và nút Đăng xuất (Drawer đã có đủ các mục này). Header điện thoại còn logo + Đăng nhập (khách) hoặc chuông (+ Đăng tin cho doanh nghiệp) + menu.
  - Nguyên nhân 2, ở `JobCard.jsx`, chỉ khi là sinh viên: nhãn "ĐÃ ỨNG TUYỂN (ACCEPTED)" không xuống dòng và nút tim bị đẩy ra ngoài. Sửa: hàng dưới `flexWrap`, `Space wrap`, khối tiêu đề `minWidth: 0`.
  - Kiểm ở 375px: khách (6 trang), sinh viên (7), doanh nghiệp (5), admin (4) đều rộng đúng 375px; khung chat nằm gọn từ 16 đến 359px; Drawer vẫn có Đăng nhập/Đăng ký. Ở 1280px header giữ nguyên như cũ. Build được, lint vẫn 28. Đăng nhập thử bằng token ký từ `JWT_SECRET` local, hết hạn sau 1 giờ, đã xoá file token sau khi dùng.
- Phát hiện lỗi có sẵn, chưa sửa: CORS chỉ cho `localhost:3000`; nếu Vite tự nhảy sang cổng khác (3001) thì mọi API trả "Lỗi hệ thống máy chủ" (500) thay vì báo lỗi CORS.

---

## ✅ Kiểu tiêu đề chương 4, mục lục, danh mục bảng và hình (đã làm ngày 26/10)
- [x] Tiêu đề chương 4 → kiểu "Heading 1" như chương 1–3 (Word tự đánh "CHƯƠNG 4:", đã bỏ chữ gõ tay); đặt "sang trang mới" để chương 4 bắt đầu ở đầu trang.
- [x] Mục 4.1–4.4 → "Mục lớn" (4 mục); mục 4.x.y → "MucNho" (9 mục); giữ số gõ tay như chương 1–2, tắt đánh số tự động.
- [x] "KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN" → kiểu "Tiêu đề" như "TÀI LIỆU THAM KHẢO".
- [x] 19 chú thích hình → kiểu "Hình"; 6 chú thích bảng → kiểu mới "Chú thích bảng" (sao từ chú thích Bảng 3.1).
- [x] Chèn danh mục tự động dưới "DANH MỤC CÁC BẢNG" (6 bảng) và "DANH MỤC CÁC HÌNH VẼ" (19 hình).
- [x] Cập nhật mục lục: đủ chương 1–4, mục 4.x, Kết luận, Tài liệu tham khảo; bỏ 2 dòng cũ không có nội dung (3.2.3 Biểu đồ lớp phân tích ca sử dụng, 3.3 Thiết kế giao diện).
- [x] Sửa thêm: chữ "d" thừa cuối chương 2 lần trước chưa xoá hẳn (lệnh xoá chỉ xoá dấu xuống dòng), nay đã xoá.
- [x] Kiểm tra trên bản sao: bản Accept All dài 38 trang; xem trang mục lục (5–6), danh mục bảng (8), danh mục hình (9), đầu chương 4 (24), Kết luận (36).
- [x] Sao lưu trước bước này: `Báo cáo đồ án 4_truoc_muc_luc_2610.docx`. File thật có 236 chỗ sửa được theo dõi; chế độ Track Changes đang tắt để các sửa tiếp theo của bạn không bị ghi lại.
- Lưu ý: sau khi Accept All, bấm chuột phải vào mục lục và hai danh mục → Update Field → Update entire table để số trang khớp bản cuối.

## ✅ Cập nhật "Báo cáo đồ án 4.docx" theo code hiện tại (đã làm ngày 26/10)
Báo cáo sửa lần cuối 13/10, trước toàn bộ đợt sửa code. Chỉ sửa nội dung chữ và bảng, không đổi định dạng.

- [x] Sao lưu: `Báo cáo đồ án 4_truoc_cap_nhat_2610.docx` (bản gốc nguyên vẹn).
- [x] Sửa bằng Word với Theo dõi thay đổi (Track Changes): 200 chỗ sửa, chạy trên bản sao trước rồi mới chép đè file thật. Word ghi tên tác giả là tài khoản Office của bạn (không đổi được), nhưng file gốc không có thay đổi nào được theo dõi, nên cả 200 chỗ đều là của đợt này.
- [x] 🔴 Bỏ Firebase, chat/chatbot, thanh toán, `payments`, `device_tokens`, Quick Switcher, "12 bảng"; sửa phần bảo mật (JWT + bcrypt), hạn chế về email, TC13.
- [x] 🟠 Bảng 3.4 (11 lớp, sửa dòng candidates, thêm companies, company_reviews, password); phiên bản Vite 8, Express 5, Ant Design 6, Expo SDK 57; cấu trúc thư mục (mobile/, tests/, job_system.sql); TC01–TC04; mâu thuẫn về mobile; "xác thực MST" thành đối soát qua API VietQR.
- [x] 🟢 Bổ sung: các lớp bảo mật (3.2.4), đánh giá doanh nghiệp, lưu việc làm, upload CV, thông báo, xuất Excel; mục 4.2.5 Ứng dụng di động (kèm ô chèn ảnh Hình 4.17); đoạn kiểm thử tự động 40 ca; TC15–TC18 (phân quyền, tải CV, tệp sai định dạng, đánh giá).
- [x] ⚪ Bỏ chữ "d" thừa; "nhóm" → "em"; chú thích Bảng 3.3; thuật ngữ thêm API, REST, JWT, SPA, UI, CSDL; thay 2 sách PHP bằng tài liệu React, Expo; bỏ các từ khoe khoang ("xuất sắc", "nổi bật", "toàn diện"...).
- [ ] Mục lục: **chưa cập nhật** vì chương 4 và Kết luận đang dùng kiểu Normal, không phải Heading; bấm Update Field lúc này sẽ làm chương 4 biến mất khỏi mục lục. Cần đặt kiểu Heading cho các tiêu đề chương 4 trước (nên làm theo báo cáo mẫu của trường).
- [ ] Bạn tự làm: duyệt các chỗ sửa trong Word (Review > Accept/Reject), rồi Accept All trước khi nộp; chụp 17 ảnh giao diện; viết mục 3.2.3, 3.3.

**Kiểm chứng**
- [x] Bản "Accept All" xuất PDF được: 33 → 36 trang, 3 ảnh có sẵn vẫn còn, thêm 1 bảng (ô chèn ảnh Hình 4.17).
- [x] Dò toàn văn bản PDF: không còn "Firebase", "chatbot", "payments", "device_tokens", "12 bảng", "Quick Switcher", "Vite 5", "xuất sắc", "thanh toán phí", "nhóm vận dụng".
- [x] Xem trực tiếp các trang có sửa (bảng use case, Bảng 3.4, bảo mật, cấu trúc thư mục, mục 4.2.5, bảng kiểm thử, kết luận, thuật ngữ): định dạng khớp với phần xung quanh.

---

## ✅ Dọn file thừa và cảnh báo lint (đã làm ngày 26/10, chưa commit)
Đã kiểm kê bằng cách dò xem file nào được import/tham chiếu ở đâu. Theo lựa chọn của bạn, giữ nguyên các bản backup `.docx` và `.vpp.bak_*` ở thư mục gốc.

### Xoá file mẫu không dùng (xoá bằng `git rm`, khôi phục được từ commit trước)
- [x] Mobile:
  - `src/components/` (themed-text, themed-view, external-link, web-badge, ui/collapsible), `src/hooks/` (use-theme, use-color-scheme, use-color-scheme.web), `src/constants/theme.ts`, `src/global.css`.
  - Ảnh mẫu: react-logo*, expo-logo, logo-glow, tutorial-web, expo-badge*, tabIcons/*.
  - `LICENSE` của template Expo.
  - Giữ: ảnh mà `app.json` dùng, `assets/expo.icon`, `AGENTS.md`, `.claude/`, `.vscode/`.
- [x] Web: `src/App.css` (và dòng import trong `main.jsx`), `src/assets/hero.png`, `react.svg`, `vite.svg`, `public/icons.svg`; viết lại `web/README.md`.
- [x] Backend: xoá 2 thư mục rỗng `models/`, `utils/`.

### Sửa cảnh báo lint của web
- [x] 120 `no-unused-vars` → 0: xoá import, biến, state và tham số không dùng; `catch (e)` không dùng thành `catch`.
  - Trang chủ bỏ lời gọi `/stats/public` vì không hiển thị số liệu nào.
  - Ba state "đang tải" trước đây không được dùng nay được nối vào giao diện: `ApplyModal` hiện Spin thay vì báo "chưa có CV" trong lúc tải, `CandidateCVPage` hiện Spin, `AdminDashboardPage` cho các thẻ số liệu `loading`.
- [x] 20 `immutability` → 0: hàm tải dữ liệu đổi sang `function`, `useEffect` dời xuống ngay sau hàm mà nó gọi.
- [x] 5 `purity` → 0: gộp 5 chỗ so sánh hạn nộp lặp lại thành `utils/jobDeadline.js` (`isDeadlinePassed`). Sửa luôn một lỗi: `JobDetailModal` coi tin không có hạn nộp là đã hết hạn (vì `new Date(null)` là năm 1970).
- [ ] Còn 28 cảnh báo, chưa đạt mục tiêu dưới 20:
  - 15 `set-state-in-effect` và 12 `exhaustive-deps`: đều thuộc mẫu "gọi API trong useEffect khi mở trang". Sửa triệt để cần đổi cách tải dữ liệu (ví dụ dùng thư viện như TanStack Query), không phải sửa vặt. Để lại cho một đợt riêng.
  - 1 `only-export-components` ở `AuthContext.jsx` (file export cả Provider lẫn hook `useAuth`): chỉ ảnh hưởng hot reload khi dev.

**Kiểm chứng:**
- [x] Web: `npm run build` được; lint 0 lỗi, 164 → 28 cảnh báo.
- [x] Trên trình duyệt (DB kiểm tra riêng, đã xoá sau khi dùng): mở đủ 19 route của khách, sinh viên, công ty và admin, kể cả trang 404 và modal ứng tuyển; trang nào cũng hiện dữ liệu, không có lỗi console (chỉ còn cảnh báo "deprecated" của antd có từ trước).
- [x] Mobile: `npx tsc --noEmit` không lỗi; `app.json` không trỏ tới ảnh đã xoá.
- [x] Backend: `npm test` 40/40.

### Review
- Xoá file dựa trên việc dò tham chiếu thật, không đoán theo tên. Cụm file mẫu của mobile chỉ import lẫn nhau nên xoá cả cụm.
- Sửa lint bằng script có soát lại diff: chỉ import và `catch` bị đổi, không đụng logic. Các chỗ còn lại sửa tay từng chỗ.
- Chưa chạy app mobile trên Expo Go sau khi xoá file; mới kiểm bằng `tsc` và dò tham chiếu ảnh.

---

## ✅ Ưu tiên 0: Bảy luồng chính bị hỏng sau đợt sửa (đã sửa ngày 26/10, chưa commit)
Lý do test vẫn pass: các test chỉ thử ca bị từ chối, chưa có ca thành công nào cho các luồng này.

- [x] 1. **Đăng ký hỏng trên web và mobile.** Web/mobile gửi `fullName`, `companyName`, `taxCode`; `validate.js` lại đòi `full_name`/`name` và zod bỏ mất các trường kia.
  - Sửa schema `register` cho khớp đúng tên trường mà client gửi và controller đọc.
- [x] 2. **Gửi đánh giá hợp lệ trả 500.** `companyController.js:145` dùng biến `parsedRating` chưa khai báo.
  - Sửa thành `numRating`.
  - Bắt lỗi `ER_DUP_ENTRY` (hai request cùng lúc vướng UNIQUE) để trả 400.
- [x] 3. **Email mời phỏng vấn không gửi được.** `emailService.js:55-58` dùng `validLocationUrl`, `safeLocation` chưa khai báo.
  - Khai báo hai biến này bằng `sanitizeUrl` và `escapeHtml`.
- [x] 4. **Đăng tin và sửa tin hỏng.**
  - Schema `job_type` đổi về `full_time`/`part_time` cho khớp với DB và web.
  - Thêm các trường controller có đọc: `category_id`, `salary_min`, `salary_max`, `salary_negotiable`, `quantity`, `status`.
  - Thêm `reject_reason` vào `updateJobStatus`.
- [x] 5. **Web không xem được CV.** `fileHelper.js` gọi `/api/uploads/cvs/...`; đổi sang `/candidates/cvs/file/<tên file>`.
  - Gọi `URL.revokeObjectURL` khi đóng xem trước.
  - Báo lỗi bằng `message` của antd, không dùng `alert`.
- [x] 6. **Xuất Excel lỗi `XLSX is not defined`** ở `AdminUsersPage` và `CompanyApplicantsPage`: dùng `await import('xlsx')` như `AdminDashboardPage`.
- [x] 7. **Lint bị tắt bớt luật.** Khôi phục `.oxlintrc.json` như HEAD (plugin react và oxc, `rules-of-hooks: error`, bật lại `no-unused-vars`). Lint phải không còn lỗi (error); số cảnh báo còn lại thuộc Ưu tiên 5.

**Test thêm (ca thành công, chạy qua `npm test`):**
- [x] Đăng ký ứng viên và công ty bằng đúng payload của web; tên lưu vào DB phải đúng.
- [x] Đăng tin `full_time` có danh mục và lương; đọc lại thấy đủ trường. Sửa tin vẫn giữ các trường đó.
- [x] Admin từ chối tin kèm lý do; lý do được lưu.
- [x] Gửi đánh giá hợp lệ → 201; gửi lần hai → 400.
- [x] Hàm tạo email phỏng vấn chạy không lỗi; link có `"` và `<` bị escape.
- [x] Đặt lịch phỏng vấn thành công → 201.

**Kiểm chứng:**
- [x] `npm test` pass hết.
- [x] `npm run build` và `npm run lint` của web không có lỗi.
- [x] Trên trình duyệt: đăng ký, xem CV, xuất Excel.

### Review Ưu tiên 0
- Nguyên nhân gốc: `validate.js` được viết theo tên trường tự đặt, không đối chiếu với payload thật của web/mobile và cột trong DB; bộ test cũ chỉ thử ca bị từ chối nên không lộ ra.
- Đã sửa:
  - Schema `register` và `jobs` khớp đúng tên trường client gửi và controller đọc.
  - Đổi `required_error` (zod 3) sang `error` (zod 4), nên thông báo lỗi ra tiếng Việt.
  - `numRating`; bắt `ER_DUP_ENTRY` trả 400.
  - Email khai báo đủ biến, link đi qua `sanitizeUrl` + `escapeHtml`; hàm trả về `{ subject, html }` để test được.
  - `fileHelper` gọi `/api/candidates/cvs/file/<tên>` bằng `fetch` có header, đọc được thông báo lỗi của server; mở tab trước rồi mới nạp tệp để không bị chặn popup; preview giải phóng Object URL khi đóng.
  - Xuất Excel dùng `await import('xlsx')`.
  - Lint khôi phục plugin react/oxc, thêm `no-undef: error`. Luật này bắt thêm 3 lỗi thật: `HomePage`, `JobsPage`, `CompaniesPage` dùng `message` mà không import (API lỗi là trang văng ReferenceError) — đã sửa.
- Test: thêm `backend/tests/flows.test.js` (11 test ca thành công). `npm test`: 40/40 pass trên DB test riêng, DB dev không đổi.
- Web: build được; lint 0 lỗi, 164 cảnh báo (dọn ở Ưu tiên 5). Mobile: `tsc` không lỗi.
- Trình duyệt (DB kiểm tra riêng, đã xoá sau khi dùng):
  - Đăng ký ứng viên từ form web → thành công, tên đúng.
  - Ứng viên xem trước CV PDF → iframe nhận đúng file; đóng modal thì Object URL bị giải phóng.
  - Xuất Excel ở trang admin và trang ứng viên của công ty → tạo file, không lỗi.
- Chưa kiểm trên trình duyệt: công ty mở CV dạng file của ứng viên (dữ liệu seed chỉ có CV online); đã có test backend cho quyền này.

---

## ✅ Đã xong và đã kiểm chứng

### Giai đoạn 0: Xác thực (commit `6d2d93c`)
- [x] Bỏ header `x-user-id`, mật khẩu vạn năng, login không mật khẩu và `/auth/demo-login`.
- [x] Đăng ký bắt buộc có mật khẩu; đổi mật khẩu phải nhập đúng mật khẩu hiện tại.
- [x] Bỏ JWT secret và mật khẩu MySQL viết cứng trong middleware và `db.js`; đổi `JWT_SECRET`.
- [x] Gỡ `.env` và `node_modules` khỏi git, thêm `.gitignore` và `.env.example`.

### Giai đoạn 1: CSDL và dữ liệu demo (chưa commit)
- [x] `job_system.sql` có cột `users.password` và bảng `company_reviews`; bỏ `payments`, `device_tokens`.
- [x] Câu SQL trong controller khớp với schema.
- [x] `seed.js` tạo: 11 tài khoản, 5 công ty, 15 tin (12 approved, 3 pending), CV, đơn, lịch phỏng vấn, đánh giá, thông báo.
- [x] Gộp các script seed cũ vào `seed.js`.

### Giai đoạn 2: Phân quyền (IDOR) (chưa commit)
- [x] Đổi trạng thái đơn, đặt lịch, đổi trạng thái lịch: kiểm tra đúng chủ sở hữu.
- [x] Xem CV và xoá CV: kiểm tra quyền sở hữu trước.
- [x] Công ty không tự duyệt tin; sửa tin đã duyệt thì về `pending`.
- [x] Danh sách và chi tiết tin lọc theo vai trò; khách gọi `?status=all` chỉ nhận tin `approved`.

### Giai đoạn 3: Upload (chưa commit)
- [x] Kiểm tra cả đuôi file lẫn MIME; tên file UUID; giới hạn 5MB (CV) và 2MB (ảnh).
- [x] Chỉ công khai `/uploads/images`; CV đi qua route có kiểm tra quyền.

### Giai đoạn 4–5: phần đã làm (chưa commit)
- [x] Thông báo tin mới gửi tới admin thật, không gửi cứng cho `user_id = 1`.
- [x] Đánh giá: `rating` 1–5; công ty không tồn tại thì trả 404.
- [x] `limit` tối đa 50, `page` tối thiểu 1.
- [x] Thêm `helmet`.
- [x] Rate limit gắn trước route (đăng nhập và đăng ký 50 lần mỗi 15 phút).
- [x] Có `backend/tests/system.test.js`, chạy được 19 test.

### Giai đoạn 7: phần đã làm (chưa commit)
- [x] Mobile tự nhận IP máy dev qua `Constants.expoConfig.hostUri`.
- [x] Mobile chặn tài khoản admin và công ty đăng nhập.

---

## 🔴 Ưu tiên 1: Hai lỗ hổng mới (làm trước tiên)

### 1a. Lộ CV đã xoá
Hiện trạng:
- `deleteCV` (`candidateController.js` ~dòng 158) chỉ xoá dòng trong DB, file vẫn nằm trên đĩa.
- `serveCVFile` (~dòng 290–294): file không có bản ghi thì trả file cho bất kỳ ai có token.
- Hàm này tìm bằng `LIKE '%filename'` và lấy dòng đầu tiên mà không `ORDER BY`.

Sửa:
- [ ] `deleteCV`: sau khi xoá bản ghi thì xoá luôn file trên đĩa. Nếu file không tồn tại thì bỏ qua, không báo lỗi.
- [ ] `serveCVFile`:
  - File không có bản ghi CV thì trả 404, kể cả với admin.
  - Tìm bản ghi bằng so khớp chính xác `file_url = '/uploads/cvs/<filename>'`, không dùng `LIKE`.
- [ ] `createCV` và `updateCV` (~dòng 72, 111): không nhận `file_url` tuỳ ý từ client; chỉ chấp nhận đường dẫn do route upload trả về (`/uploads/cvs/<uuid>.<ext>`).

### 1b. Đọc được tin chưa duyệt qua "Việc làm đã lưu"
Hiện trạng:
- `toggleSaveJob` (`savedJobController.js` ~dòng 22) lưu mọi `job_id`, không kiểm tra trạng thái tin.
- `getSavedJobs` chỉ lọc `is_deleted = 0` và trả về `j.*`.

Sửa:
- [ ] `toggleSaveJob`: chỉ cho lưu tin `approved` và chưa xoá; ngược lại thì trả 404. Vẫn cho bỏ lưu bất kể trạng thái.
- [ ] `getSavedJobs`: chỉ trả tin `approved`, hoặc trả tin bị đóng hay gỡ dưới dạng rút gọn (tiêu đề và trạng thái), không kèm nội dung.

**Kiểm chứng (thêm thành test tự động):**
- [ ] Xoá CV → file biến mất khỏi `uploads/cvs`; mở link cũ → 404.
- [ ] Ứng viên lưu `job_id` của tin `pending` → 404; danh sách đã lưu không chứa nội dung tin đó.
- [ ] Lưu và bỏ lưu tin `approved` vẫn chạy bình thường.

---

## 🔴 Ưu tiên 2: Token trên URL và email

- [ ] `serveCVFile`:
  - Bỏ nhận token qua `?token=`; chỉ nhận header `Authorization`.
  - Bỏ fallback `'secret'` (~dòng 279), dùng `JWT_SECRET` từ middleware.
  - Kiểm tra tài khoản bị khoá như các route khác: dùng chung middleware `authenticate`, không tự giải mã JWT.
- [ ] Web (`CandidateCVPage.jsx`, `CompanyApplicantsPage.jsx`):
  - Bỏ `getProtectedCvUrl`.
  - Tải file bằng `api` (có sẵn header) dạng blob, tạo `URL.createObjectURL` để xem trong iframe hoặc mở tab mới.
  - Gom thành một helper dùng chung trong `web/src/api/`.
- [ ] `emailService.js`:
  - Escape link phòng họp trước khi chèn vào `href` (~dòng 58).
  - Không escape HTML cho tiêu đề email (~dòng 55, 122), tránh hiện chữ `&amp;`.

**Kiểm chứng:**
- [ ] Gọi link CV kèm `?token=...` mà không có header → 401.
- [ ] Trên trình duyệt: ứng viên xem trước CV PDF được; công ty mở CV ứng viên được.
- [ ] Gửi lịch phỏng vấn có link chứa `"` và `<` → email hiển thị đúng dạng chữ.

---

## 🟠 Ưu tiên 3: Mục trước đây đánh dấu xong nhưng chưa làm (backend)

- [ ] `authController.register`: đưa toàn bộ phần kiểm tra lên trước `beginTransaction`; mọi nhánh lỗi sau đó đều `rollback`.
- [ ] Lỗi multer (sai định dạng, file quá lớn) trả 400 kèm thông báo tiếng Việt: thêm handler riêng trong `server.js`.
- [ ] Handler lỗi chung (`server.js` ~dòng 122): lỗi 500 chỉ trả "Lỗi hệ thống máy chủ", không trả `err.message`.
- [ ] `jobController` (~dòng 20, 385): bỏ câu `UPDATE ... closed` chạy ở mọi GET (điều kiện lọc `deadline` ở ~dòng 50 đã đủ).
- [ ] Đánh giá công ty:
  - Thêm `UNIQUE (company_id, candidate_id)` vào `company_reviews` trong `job_system.sql`.
  - `rating` phải là số nguyên thật: `"4.5"` bị từ chối.
  - `comment` không phải chuỗi thì trả 400, không để lỗi 500.
- [ ] CORS chỉ cho origin của web, lấy từ biến `CORS_ORIGIN` trong `.env`.
- [ ] Validate input bằng `zod` cho các route ghi dữ liệu chính: auth, jobs, applications, interviews, reviews, CV.
- [ ] `updateJob`: admin chỉ được set `status` trong danh sách hợp lệ; `company_id` admin truyền vào phải tồn tại.
- [ ] `firebase_uid` khi đăng ký dùng `crypto.randomUUID()` thay cho `Date.now()`, để hai người đăng ký cùng lúc không gây lỗi 500.

**Kiểm chứng:** mỗi mục có ít nhất một test tự động; không còn ca nào trả 500.

---

## 🟠 Ưu tiên 4: Test và seed an toàn

- [ ] `seed.js`:
  - Không có fallback `'123456'`; thiếu `SEED_PASSWORD` thì dừng và báo lỗi.
  - Không in mật khẩu ra console.
  - Trước khi TRUNCATE, in tên DB và yêu cầu cờ `--yes` (`npm run seed -- --yes`).
- [ ] Test chạy trên DB riêng `job_system_test`, không đụng DB dev:
  - Script `npm test` tự tạo DB test từ `job_system.sql`, seed, bật server ở cổng riêng, chạy test, rồi tắt server.
  - `tests/helpers.js` lấy địa chỉ server và mật khẩu từ biến môi trường, không viết cứng `localhost:5000` và `'123456'`.
- [ ] Bổ sung test còn thiếu:
  - Đổi trạng thái lịch phỏng vấn sai quyền.
  - Sửa tin đã duyệt thì về `pending`.
  - Xem chi tiết tin `pending` khi là khách hoặc công ty khác.
  - Upload sai loại file, file quá cỡ.
  - Các ca của Ưu tiên 1–3.

**Kiểm chứng:** `npm test` pass hết trên DB test; DB dev không thay đổi (đếm số dòng trước và sau).

---

## 🟡 Ưu tiên 5: Web (giai đoạn 6, hầu hết chưa làm)
- [ ] Responsive:
  - Import `App.css`, hoặc chuyển các `@media` vào `index.css`.
  - Navbar có menu Drawer trên điện thoại.
  - Bảng antd có `scroll={{ x: true }}` (hiện chưa bảng nào có).
- [ ] Báo lỗi cho người dùng thay vì nuốt im lặng:
  - `HomePage`, `JobsPage`, `CompaniesPage`, `CandidateSavedJobsPage`, `Navbar`.
  - `AdminDashboardPage` hiện thông báo lỗi thay vì hiện toàn số 0.
- [ ] Trang 404 thật (`App.jsx` ~dòng 173 vẫn chuyển về `/`).
- [ ] Sửa CV đã tạo (backend đã có `PUT /candidates/cvs/:id`).
- [ ] Upload avatar (backend đã có `POST /candidates/upload-avatar`).
- [ ] Bỏ giá trị viết cứng:
  - 9 chỗ "Phạm Huy Anh".
  - Tên trường trong thư xin việc.
  - Link Meet ngẫu nhiên giả (`CompanyApplicantsPage.jsx` ~dòng 403).
- [ ] Xoá CSS `.demo-role-pill`.
- [ ] Tách code theo route bằng `React.lazy`; chỉ tải `xlsx` khi bấm xuất Excel (build vẫn cảnh báo chunk > 500 kB).
- [ ] Dọn cảnh báo lint; sửa cảnh báo `fetchCVs` dùng trước khi khai báo ở `CandidateCVPage.jsx`.
- [ ] Thống nhất `borderRadius` với theme.

**Kiểm chứng:**
- [ ] `npm run build` không còn cảnh báo chunk.
- [ ] Lint dưới 20 cảnh báo.
- [ ] Xem các trang chính ở 375px và màn hình máy tính.
- [ ] Đi hết luồng sinh viên, công ty, admin trên trình duyệt.

---

## 🟡 Ưu tiên 6: Mobile (giai đoạn 7, phần còn lại)
- [ ] `toggleSaveJob` (`api.ts` ~dòng 191) vẫn gọi sai endpoint: sửa thành `POST /saved-jobs/toggle`, và thêm nút lưu hoặc bỏ lưu.
- [ ] Bộ lọc địa điểm ở màn tìm việc.
- [ ] `interviews.tsx`: hiện đúng từng trạng thái; có nút từ chối lịch.
- [ ] Token:
  - Lưu bằng `expo-secure-store` (hiện vẫn dùng AsyncStorage).
  - Nhận 401 thì đăng xuất.
  - `getMe` lỗi do hết hạn thì xoá user.
- [ ] `api.ts`: bọc `response.json()` trong try/catch, thêm timeout, báo lỗi mạng dễ hiểu.
- [ ] Bỏ `catch {}` rỗng: `index.tsx:52`, `AuthContext.tsx:84`.
- [ ] `profile.tsx`: dùng `loading` để không hiện thoáng qua form đăng nhập.
- [ ] Xoá file mẫu Expo:
  - `explore.tsx` (vẫn còn) và các component, hook, ảnh chỉ nó dùng.
  - `hint-row`, `app-tabs*`, `animated-icon*`, `scripts/reset-project.js`.
  - Viết lại `mobile/README.md`.

**Kiểm chứng:**
- [ ] `npx tsc --noEmit` không lỗi.
- [ ] Trên Expo Go: đăng nhập, tìm việc, lưu tin, ứng tuyển, xem lịch phỏng vấn.

---

## Ưu tiên 7: README và chạy lại toàn bộ
- [ ] README không công khai mật khẩu demo của admin. Hiện dòng 65 ghi mặc định `123456`.
- [ ] Hướng dẫn cài đặt từ đầu:
  - Tạo DB từ SQL.
  - Copy `.env.example` thành `.env`.
  - `npm run seed -- --yes`.
  - `npm test`.
  - `start.bat`.
- [ ] Chạy lại toàn bộ kiểm chứng trên DB tạo mới.
- [ ] Ghi phần review vào cuối file này.

---

## Việc bạn tự làm
- [ ] Đổi mật khẩu MySQL root (mật khẩu cũ còn trong commit đầu trên GitHub), rồi cập nhật `backend/.env`.
- [ ] Đổi mật khẩu admin sau khi seed.
- [ ] `git push origin main` khi muốn đưa lên GitHub.

---

## Ước lượng
| Ưu tiên | Nội dung | Ước lượng |
|---|---|---|
| 1 | Lỗ hổng CV và saved-jobs | 1–2 giờ |
| 2 | Token trên URL và email | 2–3 giờ |
| 3 | Backend còn thiếu | nửa buổi |
| 4 | Test và seed an toàn | nửa buổi |
| 5 | Web | 1–2 buổi |
| 6 | Mobile | 1 buổi |
| 7 | README và chạy lại | 1–2 giờ |

Nếu sắp bảo vệ, tối thiểu làm Ưu tiên 1, 2 và 7.
