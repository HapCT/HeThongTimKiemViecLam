// Hạn nộp hồ sơ đã qua hay chưa (so theo ngày, bỏ qua giờ)
export function isDeadlinePassed(deadline) {
  if (!deadline) return false;
  const today = new Date(new Date().toDateString());
  return new Date(deadline) < today;
}
