import type {
  ErrorResponse,
  UserDetailResponse,
  UserListResponse,
} from "@app/shared";

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

export async function fetchUser(id: number): Promise<UserDetailResponse> {
  const response = await fetch(`/api/admin/users/${id}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const data = (await response
      .json()
      .catch(() => null)) as ErrorResponse | null;
    throw new Error(
      data?.error?.message ?? "Không thể tải thông tin người dùng.",
    );
  }

  return (await response.json()) as UserDetailResponse;
}
export async function updateUserStatus(
  id: number,
  status: "ACTIVE" | "LOCKED",
): Promise<void> {
  const response = await fetch(`/api/admin/users/${id}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const data = (await response
      .json()
      .catch(() => null)) as ErrorResponse | null;

    throw new Error(
      data?.error?.message ?? "Không thể cập nhật trạng thái tài khoản.",
    );
  }
}
export async function deleteUser(id: number): Promise<void> {
  const response = await fetch(`/api/admin/users/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const data = (await response
      .json()
      .catch(() => null)) as ErrorResponse | null;

    throw new Error(
      data?.error?.message ?? "Không thể xóa tài khoản người dùng.",
    );
  }
}