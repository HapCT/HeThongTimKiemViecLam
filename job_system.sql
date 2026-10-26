-- =====================================================
-- Hệ thống tìm kiếm việc làm và thực tập cho sinh viên
-- MySQL 8.0+ | InnoDB | utf8mb4
-- =====================================================
CREATE DATABASE IF NOT EXISTS job_system
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE job_system;

-- ---------- 1. TÀI KHOẢN ----------
-- firebase_uid: liên kết với Firebase Auth (đăng nhập web + mobile dùng chung)
CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  firebase_uid  VARCHAR(128) NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password      VARCHAR(255) NULL,
  role          ENUM('candidate','company','admin') NOT NULL,
  status        ENUM('active','locked','pending') NOT NULL DEFAULT 'active',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role_status (role, status)
) ENGINE=InnoDB;

-- ---------- 2. HỒ SƠ ỨNG VIÊN ----------
CREATE TABLE candidates (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL UNIQUE,
  full_name   VARCHAR(150) NOT NULL,
  phone       VARCHAR(20),
  birth_date  DATE,
  gender      ENUM('male','female','other'),
  address     VARCHAR(255),
  university  VARCHAR(200),
  major       VARCHAR(200),
  graduation_year YEAR,
  gpa         DECIMAL(3,2),
  bio         TEXT,
  avatar_url  VARCHAR(500),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- 3. DOANH NGHIỆP ----------
CREATE TABLE companies (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL UNIQUE,
  name        VARCHAR(255) NOT NULL,
  tax_code    VARCHAR(20),
  industry    VARCHAR(150),
  size        VARCHAR(50),
  address     VARCHAR(255),
  website     VARCHAR(255),
  phone       VARCHAR(20),
  description TEXT,
  logo_url    VARCHAR(500),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_company_name (name)
) ENGINE=InnoDB;

-- ---------- 4. DANH MỤC ----------
CREATE TABLE categories (            -- ngành nghề
  id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ---------- 5. CV ----------
-- type = 'created': tạo trên hệ thống (nội dung lưu JSON)
-- type = 'uploaded': tải file lên Firebase Storage (lưu file_url)
CREATE TABLE cvs (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  candidate_id  INT UNSIGNED NOT NULL,
  title         VARCHAR(200) NOT NULL,
  type          ENUM('created','uploaded') NOT NULL,
  content       JSON NULL,
  file_url      VARCHAR(500) NULL,
  is_default    TINYINT(1) NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- 6. TIN TUYỂN DỤNG ----------
CREATE TABLE jobs (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id    INT UNSIGNED NOT NULL,
  category_id   INT UNSIGNED,
  title         VARCHAR(255) NOT NULL,
  description   TEXT NOT NULL,
  requirements  TEXT,
  benefits      TEXT,
  job_type      ENUM('full_time','part_time','internship') NOT NULL,
  location      VARCHAR(150) NOT NULL,          -- tỉnh/thành, dùng để lọc
  salary_min    INT UNSIGNED,
  salary_max    INT UNSIGNED,
  salary_negotiable TINYINT(1) NOT NULL DEFAULT 0,
  quantity      SMALLINT UNSIGNED DEFAULT 1,
  deadline      DATE,
  status        ENUM('pending','approved','rejected','closed') NOT NULL DEFAULT 'pending',
  reject_reason VARCHAR(500),
  reviewed_by   INT UNSIGNED NULL,              -- admin duyệt
  reviewed_at   DATETIME NULL,
  view_count    INT UNSIGNED NOT NULL DEFAULT 0,
  is_deleted    TINYINT(1) NOT NULL DEFAULT 0,  -- xoá mềm
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id)  REFERENCES companies(id)  ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id)      ON DELETE SET NULL,
  INDEX idx_search (status, job_type, location, category_id),
  INDEX idx_salary (salary_min, salary_max),
  FULLTEXT KEY ft_job (title, description)      -- tìm theo từ khoá
) ENGINE=InnoDB;

-- ---------- 7. VIỆC LÀM YÊU THÍCH ----------
CREATE TABLE saved_jobs (
  candidate_id INT UNSIGNED NOT NULL,
  job_id       INT UNSIGNED NOT NULL,
  saved_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (candidate_id, job_id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id)       REFERENCES jobs(id)       ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- 8. ĐƠN ỨNG TUYỂN ----------
CREATE TABLE applications (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_id        INT UNSIGNED NOT NULL,
  candidate_id  INT UNSIGNED NOT NULL,
  cv_id         INT UNSIGNED NOT NULL,
  cover_letter  TEXT,
  status        ENUM('submitted','viewed','interview','accepted','rejected')
                NOT NULL DEFAULT 'submitted',
  note          VARCHAR(500),                   -- ghi chú của doanh nghiệp
  applied_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_apply (job_id, candidate_id),   -- mỗi người ứng tuyển 1 lần/tin
  FOREIGN KEY (job_id)       REFERENCES jobs(id)       ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (cv_id)        REFERENCES cvs(id),
  INDEX idx_cand_status (candidate_id, status)
) ENGINE=InnoDB;

-- ---------- 9. LỊCH PHỎNG VẤN ----------
CREATE TABLE interviews (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  application_id INT UNSIGNED NOT NULL,
  scheduled_at   DATETIME NOT NULL,
  format         ENUM('online','offline') NOT NULL DEFAULT 'online',
  location       VARCHAR(255),                  -- địa chỉ hoặc link họp
  note           VARCHAR(500),
  status         ENUM('scheduled','confirmed','declined','cancelled','done')
                 NOT NULL DEFAULT 'scheduled',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  INDEX idx_sched (scheduled_at)
) ENGINE=InnoDB;

-- ---------- 10. THÔNG BÁO ----------
-- Lưu lịch sử thông báo trong MySQL
CREATE TABLE notifications (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,            -- người nhận
  sender_id   INT UNSIGNED NULL,                -- người gửi (DN / hệ thống)
  title       VARCHAR(255) NOT NULL,
  body        TEXT,
  type        ENUM('application','interview','system','job') NOT NULL DEFAULT 'system',
  ref_id      INT UNSIGNED NULL,                -- id đơn ứng tuyển / lịch PV / tin
  is_read     TINYINT(1) NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_read (user_id, is_read, created_at)
) ENGINE=InnoDB;

-- ---------- 11. ĐÁNH GIÁ DOANH NGHIỆP ----------
CREATE TABLE company_reviews (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id   INT UNSIGNED NOT NULL,
  candidate_id INT UNSIGNED NOT NULL,
  rating       TINYINT UNSIGNED NOT NULL DEFAULT 5,
  comment      TEXT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  UNIQUE KEY unique_company_candidate (company_id, candidate_id),
  INDEX idx_comp_review (company_id)
) ENGINE=InnoDB;

-- ---------- DỮ LIỆU MẪU ----------
INSERT INTO categories (name) VALUES
 ('Công nghệ thông tin'),('Kinh tế - Tài chính'),('Marketing'),
 ('Thiết kế'),('Giáo dục'),('Kỹ thuật');