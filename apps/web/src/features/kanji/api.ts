import type { ErrorResponse, KanjiListResponse } from "@app/shared";

const CONNECTION_ERROR = "Lỗi kết nối!";

export async function fetchKanjiList(
  page: number,
  pageSize: number,
): Promise<KanjiListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  let response: Response;

  try {
    response = await fetch(`/api/kanji?${params}`, {
      method: "GET",
      credentials: "include",
    });
  } catch {
    // fetch only rejects when the server cannot be reached.
    throw new Error(CONNECTION_ERROR);
  }

  // The API answers 500 when it cannot reach the database.
  if (response.status >= 500) {
    throw new Error(CONNECTION_ERROR);
  }

  if (!response.ok) {
    const data = (await response
      .json()
      .catch(() => null)) as ErrorResponse | null;
    throw new Error(data?.error?.message ?? "Không thể tải danh sách Kanji.");
  }

  return (await response.json()) as KanjiListResponse;
}
