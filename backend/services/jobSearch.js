// Dựng điều kiện WHERE cho tìm kiếm việc làm, dùng chung cho GET /api/jobs và chatbot.
// status: 'all' | 'approved' | 'pending' | ... (đã được phân quyền ở nơi gọi)
function buildJobFilters({
  status = 'approved',
  keyword,
  category_id,
  location,
  job_type,
  min_salary,
  max_salary,
  company_id
} = {}) {
  const params = [];
  const whereClauses = ['j.is_deleted = 0'];

  if (status !== 'all') {
    whereClauses.push('j.status = ?');
    params.push(status);
  }

  // Ẩn các tin đã quá hạn nộp hồ sơ khi tìm kiếm việc làm công khai đang tuyển
  if (status === 'approved') {
    whereClauses.push('(j.deadline IS NULL OR j.deadline >= CURDATE())');
  }

  if (company_id) {
    whereClauses.push('j.company_id = ?');
    params.push(company_id);
  }

  if (category_id) {
    whereClauses.push('j.category_id = ?');
    params.push(category_id);
  }

  if (job_type) {
    whereClauses.push('j.job_type = ?');
    params.push(job_type);
  }

  if (location) {
    whereClauses.push('j.location LIKE ?');
    params.push(`%${String(location).trim()}%`);
  }

  if (keyword) {
    whereClauses.push('(j.title LIKE ? OR j.description LIKE ? OR comp.name LIKE ?)');
    const kw = `%${String(keyword).trim()}%`;
    params.push(kw, kw, kw);
  }

  if (min_salary) {
    whereClauses.push('(j.salary_max >= ? OR j.salary_negotiable = 1)');
    params.push(parseInt(min_salary, 10));
  }

  if (max_salary) {
    whereClauses.push('(j.salary_min <= ? OR j.salary_negotiable = 1)');
    params.push(parseInt(max_salary, 10));
  }

  return { whereSql: `WHERE ${whereClauses.join(' AND ')}`, params };
}

module.exports = { buildJobFilters };
