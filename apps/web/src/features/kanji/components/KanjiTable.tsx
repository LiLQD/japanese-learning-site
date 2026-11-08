import { Link } from "react-router";
import type { KanjiListItem } from "@app/shared";

type KanjiTableProps = {
  kanji: KanjiListItem[];
  emptyMessage?: string;
  // Admins get an extra "Thao tác" column with the edit link.
  isAdmin?: boolean;
  // Current list page, so the edit page can return to it.
  page?: number;
  onDelete?: (item: KanjiListItem) => void;
};

// Sent to the edit page so Hủy / Cập nhật return to the same list page.
export type KanjiEditLocationState = {
  fromPage?: number;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}

function KanjiTable({
  kanji,
  emptyMessage = "Chưa có dữ liệu Kanji nào trong hệ thống",
  isAdmin = false,
  page = 1,
  onDelete,
}: KanjiTableProps) {
  if (kanji.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Chữ Kanji</th>
          <th>Số nét</th>
          <th>Bộ thủ</th>
          <th>Cấp độ JLPT</th>
          <th>Ngày tạo</th>
          {isAdmin && <th>Thao tác</th>}
        </tr>
      </thead>
      <tbody>
        {kanji.map((item) => (
          <tr key={item.id}>
            <td>{item.id}</td>
            <td className="kanji-character" lang="ja">
              <Link
                to={`/kanji/${item.id}`}
                state={{ page }}
                aria-label={`Xem chi tiết Kanji ${item.character}`}
              >
                {item.character}
              </Link>
            </td>
            <td>{item.strokeCount ?? "—"}</td>
            <td lang="ja">{item.radical ?? "—"}</td>
            <td>{item.jlpt ? `N${item.jlpt}` : "—"}</td>
            <td>{formatDate(item.createdAt)}</td>
            {isAdmin && (
              <td>
                <div className="kanji-row-actions">
                  <Link
                    to={`/kanji/${item.id}/edit`}
                    state={{ fromPage: page } satisfies KanjiEditLocationState}
                    className="kanji-button-secondary kanji-row-action"
                  >
                    Sửa
                  </Link>
                  {onDelete && (
                    <button
                      type="button"
                      className="kanji-button-danger kanji-row-action"
                      onClick={() => onDelete(item)}
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default KanjiTable;
