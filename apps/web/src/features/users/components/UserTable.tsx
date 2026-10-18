import { Link } from "react-router";
import type { UserListItem } from "@app/shared";

type UserTableProps = {
  users: UserListItem[];
  emptyMessage?: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}

function UserTable({
  users,
  emptyMessage = "Chưa có người dùng nào.",
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
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default UserTable;
