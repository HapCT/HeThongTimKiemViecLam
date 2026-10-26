// file_url trong DB có dạng /uploads/cvs/<tên file>; backend phục vụ tệp CV qua route có kiểm tra quyền
function toProtectedCvPath(cvFileUrl) {
  const filename = cvFileUrl.split('/').pop();
  return `/api/candidates/cvs/file/${encodeURIComponent(filename)}`;
}

/**
 * Tải tệp CV được bảo vệ kèm header Authorization dưới dạng Blob,
 * rồi tạo Object URL để xem trong iframe hoặc mở tab mới.
 * Người gọi phải URL.revokeObjectURL khi không dùng nữa.
 */
export async function fetchProtectedCvBlobUrl(cvFileUrl) {
  if (!cvFileUrl) return null;
  const token = localStorage.getItem('token');
  const res = await fetch(toProtectedCvPath(cvFileUrl), {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || 'Không thể tải tệp CV. Vui lòng kiểm tra quyền truy cập của bạn.');
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/**
 * Mở tệp CV bảo mật trong tab mới.
 * Tab được mở ngay trong lúc người dùng bấm để trình duyệt không chặn popup, rồi mới nạp tệp.
 */
export async function openProtectedCvInNewTab(cvFileUrl) {
  const win = window.open('', '_blank');
  try {
    const blobUrl = await fetchProtectedCvBlobUrl(cvFileUrl);
    if (win) {
      win.location.href = blobUrl;
    } else {
      window.location.href = blobUrl;
    }
    // Tab mới đã nạp xong tệp thì giải phóng Object URL
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch (error) {
    if (win) win.close();
    throw error;
  }
}
