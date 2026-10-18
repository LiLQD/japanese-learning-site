import type {
  ProfileResponse,
  UpdateProfileInput,
  ChangePasswordInput,
} from "@app/shared";

export async function fetchProfile(): Promise<{ user: ProfileResponse }> {
  const res = await fetch("/api/users/me");
  if (!res.ok) throw new Error("Không thể tải thông tin cá nhân");
  return res.json();
}

export async function updateProfile(
  data: UpdateProfileInput,
): Promise<{ user: ProfileResponse }> {
  const res = await fetch("/api/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || "Cập nhật thất bại");
  }
  return res.json();
}

export async function changePassword(data: ChangePasswordInput): Promise<void> {
  const res = await fetch("/api/users/me/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || "Đổi mật khẩu thất bại");
  }
}
