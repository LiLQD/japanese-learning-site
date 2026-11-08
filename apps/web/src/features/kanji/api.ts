import type {
  ErrorResponse,
  KanjiInput,
  KanjiListResponse,
  KanjiResponse,
} from "@app/shared";

export const CONNECTION_ERROR = "Lỗi kết nối!";
export const KANJI_PAGE_SIZE = 20;
export const KANJI_NOT_FOUND = "Không tìm thấy chữ Kanji này!";

async function requestJson<T>(
  url: string,
  init: RequestInit,
  fallbackMessage: string,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, { ...init, credentials: "include" });
  } catch {
    // fetch only rejects when the server cannot be reached.
    throw new Error(CONNECTION_ERROR);
  }

  // The API answers 500 when it cannot reach the database.
  if (response.status >= 500) {
    throw new Error(CONNECTION_ERROR);
  }

  if (response.status === 401) {
    throw new Error("Vui lòng đăng nhập để tiếp tục.");
  }

  if (response.status === 403) {
    throw new Error("Bạn không có quyền thực hiện thao tác này.");
  }

  if (!response.ok) {
    const data = (await response
      .json()
      .catch(() => null)) as ErrorResponse | null;
    throw new Error(data?.error?.message ?? fallbackMessage);
  }

  // 204 No Content (e.g. DELETE) has no body to parse.
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function fetchKanjiList(
  page: number,
  pageSize: number,
  keyword = "",
): Promise<KanjiListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (keyword.trim()) {
    params.set("keyword", keyword.trim());
  }

  return requestJson(
    `/api/kanji?${params}`,
    { method: "GET" },
    "Không thể tải danh sách Kanji.",
  );
}

export function createKanji(input: KanjiInput): Promise<KanjiResponse> {
  return requestJson<KanjiResponse>(
    "/api/kanji",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Không thể thêm chữ Kanji.",
  );
}

export function fetchKanji(id: number): Promise<KanjiResponse> {
  return requestJson<KanjiResponse>(
    `/api/kanji/${id}`,
    { method: "GET" },
    "Không thể tải chữ Kanji.",
  );
}

export function updateKanji(
  id: number,
  input: KanjiInput,
): Promise<KanjiResponse> {
  return requestJson<KanjiResponse>(
    `/api/kanji/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Không thể cập nhật chữ Kanji.",
  );
}

export function deleteKanji(id: number): Promise<void> {
  return requestJson<void>(
    `/api/kanji/${id}`,
    { method: "DELETE" },
    "Không thể xóa chữ Kanji.",
  );
}
