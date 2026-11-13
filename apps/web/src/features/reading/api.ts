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
