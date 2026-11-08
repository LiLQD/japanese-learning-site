import type {
  ErrorResponse,
  WordDetailResponse,
  WordListResponse,
  CreateWordInput,
} from "@app/shared";

export const WORDS_PAGE_SIZE = 20;
export const CONNECTION_ERROR = "Lỗi kết nối!";

async function requestJson<T>(
  url: string,
  fallbackMessage: string,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });
  } catch {
    throw new Error(CONNECTION_ERROR);
  }

  if (response.status >= 500) {
    throw new Error(CONNECTION_ERROR);
  }

  if (response.status === 401) {
    throw new Error("Vui lòng đăng nhập để tiếp tục.");
  }

  if (!response.ok) {
    const data = (await response
      .json()
      .catch(() => null)) as ErrorResponse | null;
    throw new Error(data?.error?.message ?? fallbackMessage);
  }

  return (await response.json()) as T;
}

export function fetchWordList(
  q: string,
  page: number,
  pageSize: number,
): Promise<WordListResponse> {
  const params = new URLSearchParams({
    q,
    page: String(page),
    pageSize: String(pageSize),
  });

  return requestJson<WordListResponse>(
    `/api/words?${params}`,
    "Không thể tải danh sách từ vựng.",
  );
}

export function fetchWord(id: number): Promise<WordDetailResponse> {
  return requestJson<WordDetailResponse>(
    `/api/words/${id}`,
    "Không thể tải thông tin từ vựng.",
  );
}
export async function createWord(data: CreateWordInput): Promise<void> {
  const response = await fetch("/api/words", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error?.message || "Thêm từ vựng thất bại.");
  }
}
