require('dotenv').config();
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DEV_DB_NAME = process.env.DB_NAME || 'job_system';
const TEST_DB_NAME = 'job_system_test';
const TEST_PORT = process.env.TEST_PORT || '5005';
const SEED_PASSWORD = process.env.SEED_PASSWORD || '123456';

async function getTableCounts(connection, dbName) {
  try {
    const [tables] = await connection.query(`SHOW TABLES FROM \`${dbName}\``);
    const counts = {};
    for (const row of tables) {
      const tableName = Object.values(row)[0];
      const [res] = await connection.query(`SELECT COUNT(*) AS total FROM \`${dbName}\`.\`${tableName}\``);
      counts[tableName] = res[0].total;
    }
    return counts;
  } catch (err) {
    return null;
  }
}

async function waitForServer(url, timeoutMs = 15000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (e) {
      // Server chưa khởi động xong, chờ 200ms
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

async function run() {
  console.log('=====================================================');
  console.log('   BẮT ĐẦU CHẠY KIỂM THỬ TỰ ĐỘNG AN TOÀN TRÊN DB TEST');
  console.log('=====================================================');
  console.log(`ℹ DB Phát triển: [${DEV_DB_NAME}] | DB Kiểm thử: [${TEST_DB_NAME}]`);
  console.log(`ℹ Cổng server test: [${TEST_PORT}]`);

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_PORT) || 3306
  };

  let rootConn;
  let serverProcess;

  try {
    // 1. Kết nối MySQL
    rootConn = await mysql.createConnection(dbConfig);

    // 2. Kiểm tra và đếm số dòng DB Dev trước khi test
    const beforeCounts = await getTableCounts(rootConn, DEV_DB_NAME);
    if (beforeCounts) {
      console.log(`✓ Đã ghi nhận hiện trạng DB dev [${DEV_DB_NAME}] (${Object.keys(beforeCounts).length} bảng).`);
    }

    // 3. Khởi tạo DB test hoàn toàn độc lập
    console.log(`⚙ Đang tạo và định cấu hình cơ sở dữ liệu test [${TEST_DB_NAME}]...`);
    await rootConn.query(`DROP DATABASE IF EXISTS \`${TEST_DB_NAME}\``);
    await rootConn.query(`CREATE DATABASE \`${TEST_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

    // 4. Nạp cấu trúc bảng từ job_system.sql
    const sqlPath = path.resolve(__dirname, '../../job_system.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Không tìm thấy file schema tại: ${sqlPath}`);
    }
    let sqlContent = fs.readFileSync(sqlPath, 'utf8');
    // Chuyển hướng database sang TEST_DB_NAME
    sqlContent = sqlContent
      .replace(/CREATE DATABASE IF NOT EXISTS job_system/g, `CREATE DATABASE IF NOT EXISTS ${TEST_DB_NAME}`)
      .replace(/USE job_system;/g, `USE ${TEST_DB_NAME};`);

    const testDbConn = await mysql.createConnection({
      ...dbConfig,
      database: TEST_DB_NAME,
      multipleStatements: true
    });
    await testDbConn.query(sqlContent);
    await testDbConn.end();
    console.log(`✓ Đã nạp thành công cấu trúc bảng vào [${TEST_DB_NAME}]`);

    // 5. Seed dữ liệu mẫu vào DB test
    console.log(`⚙ Đang nạp dữ liệu mẫu vào [${TEST_DB_NAME}]...`);
    execSync(`node scripts/seed.js --yes`, {
      cwd: path.resolve(__dirname, '..'),
      env: {
        ...process.env,
        DB_NAME: TEST_DB_NAME,
        SEED_PASSWORD: SEED_PASSWORD
      },
      stdio: 'pipe'
    });
    console.log(`✓ Đã seed dữ liệu thành công vào [${TEST_DB_NAME}]`);

    // 6. Bật server kiểm thử ở cổng riêng (TEST_PORT)
    console.log(`⚙ Đang khởi động server kiểm thử tại cổng ${TEST_PORT}...`);
    serverProcess = spawn('node', ['server.js'], {
      cwd: path.resolve(__dirname, '..'),
      env: {
        ...process.env,
        PORT: TEST_PORT,
        DB_NAME: TEST_DB_NAME,
        SEED_PASSWORD: SEED_PASSWORD,
        // Không gọi Gemini thật khi kiểm thử, kể cả khi .env đã có key
        GEMINI_API_KEY: ''
      }
    });

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) console.log(`  [Server Test]: ${msg}`);
    });

    serverProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) console.error(`  [Server Test Err]: ${msg}`);
    });

    const isReady = await waitForServer(`http://localhost:${TEST_PORT}/api/health`, 15000);
    if (!isReady) {
      throw new Error(`Server kiểm thử không phản hồi tại cổng ${TEST_PORT} sau 15 giây.`);
    }
    console.log(`✓ Server test đã sẵn sàng tại http://localhost:${TEST_PORT}`);

    // 7. Chạy bộ kiểm thử Node Test Runner
    console.log('=====================================================');
    console.log('             THỰC THI BỘ KIỂM THỬ SYSTEM            ');
    console.log('=====================================================');

    let testStatus = 0;
    try {
      execSync('node --test tests/**/*.test.js', {
        cwd: path.resolve(__dirname, '..'),
        env: {
          ...process.env,
          TEST_PORT: TEST_PORT,
          TEST_API_URL: `http://localhost:${TEST_PORT}/api`,
          SEED_PASSWORD: SEED_PASSWORD,
          // Test gọi thẳng service (chatbot.test.js) cũng phải dùng DB test
          DB_NAME: TEST_DB_NAME
        },
        stdio: 'inherit'
      });
    } catch (testError) {
      testStatus = testError.status || 1;
    }

    // 8. Đếm lại số dòng DB dev và đối chiếu
    if (beforeCounts) {
      const afterCounts = await getTableCounts(rootConn, DEV_DB_NAME);
      let isIdentical = true;
      for (const [tbl, count] of Object.entries(beforeCounts)) {
        if (afterCounts[tbl] !== count) {
          isIdentical = false;
          console.warn(`⚠ Cảnh báo: Bảng dev ${tbl} thay đổi số dòng từ ${count} -> ${afterCounts[tbl]}`);
        }
      }
      if (isIdentical) {
        console.log('=====================================================');
        console.log(`✓ XÁC NHẬN AN TOÀN: DB Dev [${DEV_DB_NAME}] HOÀN TOÀN KHÔNG BỊ ẢNH HƯỞNG!`);
        console.log('=====================================================');
      }
    }

    if (testStatus !== 0) {
      console.error('❌ Kiểm thử thất bại!');
      process.exit(testStatus);
    } else {
      console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ ĐỀU VƯỢT QUA XUẤT SẮC (PASS 100%)!');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Lỗi trong quá trình chuẩn bị hoặc thực thi kiểm thử:', err.message);
    process.exit(1);
  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
    if (rootConn) {
      try {
        await rootConn.query(`DROP DATABASE IF EXISTS \`${TEST_DB_NAME}\``);
        await rootConn.end();
      } catch (e) {}
    }
  }
}

run();
