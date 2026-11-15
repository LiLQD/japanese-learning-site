import type { ReadingInput } from "@app/shared";

export interface ReadingPassage {
  id: number;
  title: string;
  jlpt: number | null;
}

export interface ReadingListResponse {
  passages: ReadingPassage[];
}

/**
 * Lấy danh sách bài đọc từ API.
 * API: GET /api/reading
 */
export async function fetchReadingList(): Promise<ReadingListResponse> {
  let response: Response;

  try {
    response = await fetch("/api/reading", {
      method: "GET",
      credentials: "include",
    });
  } catch {
    throw new Error("Không thể kết nối đến máy chủ.");
  }

  if (response.status >= 500) {
    throw new Error("Máy chủ đang gặp lỗi. Vui lòng thử lại sau.");
  }

  if (!response.ok) {
    throw new Error("Không thể tải danh sách bài đọc.");
  }

  return (await response.json()) as ReadingListResponse;
}

export interface ReadingPassageDetail extends ReadingPassage {
  content: string;
  translation: string | null;
}

export interface ReadingDetailResponse {
  passage: ReadingPassageDetail;
}

/**
 * Lấy nội dung chi tiết bài đọc theo ID.
 * API: GET /api/reading/:id
 */
export async function fetchReadingDetail(
  id: number,
): Promise<ReadingDetailResponse> {
  let response: Response;

  try {
    response = await fetch(`/api/reading/${id}`, {
      method: "GET",
      credentials: "include",
    });
  } catch {
    throw new Error("Không thể kết nối đến máy chủ.");
  }

  if (response.status === 404) {
    throw new Error("Không tìm thấy bài đọc.");
  }

  if (response.status >= 500) {
    throw new Error("Máy chủ đang gặp lỗi. Vui lòng thử lại sau.");
  }

  if (!response.ok) {
    throw new Error("Không thể tải nội dung bài đọc.");
  }

  return (await response.json()) as ReadingDetailResponse;
}

export async function createReading(data: ReadingInput): Promise<void> {
  const res = await fetch("/api/reading", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || "Thêm bài đọc thất bại.");
  }
}

export async function updateReading(
  id: number,
  data: ReadingInput,
): Promise<void> {
  const res = await fetch(`/api/reading/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || "Cập nhật bài đọc thất bại.");
  }
}

export async function deleteReading(id: number): Promise<void> {
  const res = await fetch(`/api/reading/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || "Xóa bài đọc thất bại.");
  }
}
