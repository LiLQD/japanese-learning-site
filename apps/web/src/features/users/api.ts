import type { ErrorResponse, UserListResponse } from "@app/shared";

export async function fetchUsers(
  page: number,
  pageSize: number,
  q = "",
): Promise<UserListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (q) params.set("q", q);

  const response = await fetch(`/api/admin/users?${params}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const data = (await response
      .json()
      .catch(() => null)) as ErrorResponse | null;
    throw new Error(
      data?.error?.message ?? "Không thể tải danh sách người dùng.",
    );
  }

  return (await response.json()) as UserListResponse;
}
