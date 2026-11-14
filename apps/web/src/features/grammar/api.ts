import type { ErrorResponse, GrammarListResponse } from "@app/shared";

export const CONNECTION_ERROR = "Lỗi kết nối!";
export const GRAMMAR_PAGE_SIZE = 20;

export async function fetchGrammarList(
  page: number,
  pageSize: number,
): Promise<GrammarListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  let response: Response;

  try {
    response = await fetch(`/api/grammar?${params}`, {
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
    throw new Error(
      data?.error?.message ?? "Không thể tải danh sách ngữ pháp.",
    );
  }

  return (await response.json()) as GrammarListResponse;
}

export async function fetchAdminGrammarList(
  page: number,
  pageSize: number,
): Promise<GrammarListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  let response: Response;
  try {
    response = await fetch(`/api/admin/grammar?${params}`, {
      credentials: "include",
    });
  } catch {
    throw new Error(CONNECTION_ERROR);
  }

  if (!response.ok) {
    const data = (await response
      .json()
      .catch(() => null)) as ErrorResponse | null;
    const message = data?.error?.message;
    if (message === CONNECTION_ERROR) {
      throw new Error(CONNECTION_ERROR);
    }
    throw new Error(message ?? "Không thể tải danh sách ngữ pháp.");
  }

  return (await response.json()) as GrammarListResponse;
}
