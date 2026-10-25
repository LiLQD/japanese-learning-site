import { Link } from "react-router";
import type { UserListItem } from "@app/shared";

type UserTableProps = {
  users: UserListItem[];
  emptyMessage?: string;
  onUpdateStatus: (id: number, status: "ACTIVE" | "LOCKED") => void;
  updatingUserId: number | null;
  onDelete: (id: number) => void;
  deletingUserId: number | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}

function UserTable({
  users,
  emptyMessage = "Chưa có người dùng nào.",
  onUpdateStatus,
  updatingUserId,
  onDelete,
  deletingUserId,
}: UserTableProps) {
  if (users.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Email</th>
          <th>Họ tên</th>
          <th>Vai trò</th>
          <th>Trạng thái</th>
          <th>Xác minh email</th>
          <th>Ngày tạo</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>
              <Link to={`/admin/users/${user.id}`}>{user.email}</Link>
            </td>
            <td>{user.displayName}</td>
            <td>{user.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}</td>
            <td>{user.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}</td>
            <td>{user.emailVerifiedAt ? "Đã xác minh" : "Chưa xác minh"}</td>
            <td>{formatDate(user.createdAt)}</td>
            <td>
              <button
                type="button"
                disabled={
                  updatingUserId === user.id || deletingUserId === user.id
                }
                onClick={() =>
                  onUpdateStatus(
                    user.id,
                    user.status === "ACTIVE" ? "LOCKED" : "ACTIVE",
                  )
                }
              >
                {updatingUserId === user.id
                  ? "Đang cập nhật..."
                  : user.status === "ACTIVE"
                    ? "Khóa tài khoản"
                    : "Mở khóa tài khoản"}
              </button>

              {user.role !== "ADMIN" && (
                <button
                  type="button"
                  disabled={
                    updatingUserId === user.id || deletingUserId !== null
                  }
                  onClick={() => {
                    const confirmed = window.confirm(
                      `Bạn có chắc chắn muốn xóa tài khoản "${user.email}" không? Hành động này không thể hoàn tác.`,
                    );

                    if (confirmed) {
                      onDelete(user.id);
                    }
                  }}
                >
                  {deletingUserId === user.id ? "Đang xóa..." : "Xóa tài khoản"}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default UserTable;
