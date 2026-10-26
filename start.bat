@echo off
chcp 65001 >nul
title Khởi Chạy Hệ Thống Tìm Kiếm Việc Làm & Thực Tập - UTEHY

echo =====================================================================
echo    ĐỒ ÁN 4: HỆ THỐNG TÌM KIẾM VIỆC LÀM & THỰC TẬP CHO SINH VIÊN
echo    Sinh viên: Phạm Huy Anh - MSV: 12523003
echo    GVHD: ThS. Nguyễn Hoàng Điệp - Trường ĐH SPKT Hưng Yên (UTEHY)
echo =====================================================================
echo.

echo [1/3] Đang khởi động Backend Server (Port 5000)...
start "JobUTEHY - Backend API" cmd /k "cd /d %~dp0backend && npm start"

timeout /t 2 /nobreak >nul

echo [2/3] Đang khởi động Frontend Web Portal (Port 3000)...
start "JobUTEHY - Frontend Web" cmd /k "cd /d %~dp0web && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Đang mở trình duyệt tại: http://localhost:3000
start http://localhost:3000

echo.
echo =====================================================================
echo  HỆ THỐNG ĐÃ SẴN SÀNG!
echo  - Frontend Web: http://localhost:3000
echo  - Backend API:  http://localhost:5000/api
echo  - MySQL CSDL:   localhost:3306 (job_system)
echo =====================================================================
pause
