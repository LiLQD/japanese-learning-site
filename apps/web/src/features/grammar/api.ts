import type {
  ErrorResponse,
  GrammarAdminDetailResponse,
  GrammarCreateInput,
  GrammarCreateResponse,
  GrammarDetailResponse,
  GrammarExamplesResponse,
  GrammarListResponse,
  GrammarUpdateInput,
} from "@app/shared";

export const CONNECTION_ERROR = "Lỗi kết nối!";
export const GRAMMAR_PAGE_SIZE = 20;
export const GRAMMAR_NOT_FOUND = "Không tìm thấy ngữ pháp này!";

export type GrammarFilters = {
  keyword?: string;
  // 1 = N1 … 5 = N5; undefined = every level.
  jlpt?: number;
};

export async function fetchGrammarList(
  page: number,
  pageSize: number,
  keyword?: string,
  jlpt?: number,
): Promise<GrammarListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (keyword?.trim()) params.set("keyword", keyword.trim());
  if (jlpt) params.set("jlpt", String(jlpt));

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

export async function fetchGrammar(id: number): Promise<GrammarDetailResponse> {
  let response: Response;

  try {
    response = await fetch(`/api/grammar/${id}`, { credentials: "include" });
  } catch {
    throw new Error(CONNECTION_ERROR);
  }

  if (response.status >= 500) {
    throw new Error(CONNECTION_ERROR);
  }

  if (!response.ok) {
    const data = (await response
      .json()
      .catch(() => null)) as ErrorResponse | null;
    throw new Error(data?.error?.message ?? "Không thể tải ngữ pháp.");
  }

  return (await response.json()) as GrammarDetailResponse;
}

export async function fetchAdminGrammarList(
  page: number,
  pageSize: number,
  keyword?: string,
): Promise<GrammarListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (keyword?.trim()) params.set("keyword", keyword.trim());

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

export async function createGrammar(
  input: GrammarCreateInput,
): Promise<GrammarCreateResponse> {
  let response: Response;

  try {
    response = await fetch("/api/grammar", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error("Không thể kết nối máy chủ. Vui lòng thử lại.");
  }

  const data = (await response.json().catch(() => null)) as
    | GrammarCreateResponse
    | ErrorResponse
    | null;

  if (!response.ok) {
    const error = data && "error" in data ? data.error : null;

    switch (error?.code) {
      case "BAD_REQUEST":
        throw new Error(error.message || "Dữ liệu ngữ pháp chưa hợp lệ.");
      case "UNAUTHORIZED":
        throw new Error("Vui lòng đăng nhập để tiếp tục.");
      case "FORBIDDEN":
        throw new Error("Bạn không có quyền thực hiện thao tác này.");
      case "DATABASE_UNAVAILABLE":
        throw new Error("Lỗi kết nối!");
      case "INTERNAL":
        throw new Error("Không thể lưu dữ liệu ngữ pháp. Vui lòng thử lại.");
      default:
        throw new Error(error?.message ?? "Không thể thêm dữ liệu ngữ pháp.");
    }
  }

  return data as GrammarCreateResponse;
}

export async function fetchGrammarExamples(
  id: number,
): Promise<GrammarExamplesResponse> {
  let response: Response;

  try {
    response = await fetch(`/api/grammar/${id}/examples`, {
      credentials: "include",
    });
  } catch {
    throw new Error(CONNECTION_ERROR);
  }

  if (response.status >= 500) {
    throw new Error(CONNECTION_ERROR);
  }

  if (!response.ok) {
    const data = (await response
      .json()
      .catch(() => null)) as ErrorResponse | null;
    throw new Error(data?.error?.message ?? "Không thể tải ví dụ ngữ pháp.");
  }

  return (await response.json()) as GrammarExamplesResponse;
}

async function adminGrammarRequest<T extends object>(
  url: string,
  init: RequestInit,
  fallbackMessage: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, credentials: "include" });
  } catch {
    throw new Error(CONNECTION_ERROR);
  }

  const data = (await response.json().catch(() => null)) as
    | T
    | ErrorResponse
    | null;

  if (!response.ok) {
    const error = data && "error" in data ? data.error : null;
    if (error?.message === CONNECTION_ERROR) {
      throw new Error(CONNECTION_ERROR);
    }

    switch (error?.code) {
      case "UNAUTHORIZED":
        throw new Error("Vui lòng đăng nhập để tiếp tục.");
      case "FORBIDDEN":
        throw new Error("Bạn không có quyền thực hiện thao tác này.");
      case "NOT_FOUND":
        throw new Error("Không tìm thấy ngữ pháp này!");
      case "BAD_REQUEST":
        throw new Error(error.message || fallbackMessage);
      case "DATABASE_UNAVAILABLE":
        throw new Error(CONNECTION_ERROR);
      case "INTERNAL":
        throw new Error(fallbackMessage);
      default:
        throw new Error(error?.message ?? fallbackMessage);
    }
  }

  return data as T;
}

export function fetchAdminGrammar(
  id: number,
): Promise<GrammarAdminDetailResponse> {
  return adminGrammarRequest(
    `/api/admin/grammar/${id}`,
    { method: "GET" },
    "Không thể tải dữ liệu ngữ pháp.",
  );
}

export function updateGrammar(
  id: number,
  input: GrammarUpdateInput,
): Promise<GrammarAdminDetailResponse> {
  return adminGrammarRequest(
    `/api/admin/grammar/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Không thể cập nhật dữ liệu ngữ pháp.",
  );
}

export async function deleteGrammar(id: number): Promise<void> {
  await adminGrammarRequest<Record<string, never>>(
    `/api/admin/grammar/${id}`,
    { method: "DELETE" },
    "Không thể xóa dữ liệu ngữ pháp.",
  );
}
