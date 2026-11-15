import type { GrammarListItem } from "@app/shared";
import { Link } from "react-router";

type GrammarAdminTableProps = {
  grammars: GrammarListItem[];
  page: number;
  pageSize: number;
  onDelete: (grammar: GrammarListItem) => void;
};

function formatJlpt(jlpt: number | null) {
  if (jlpt === null) return "Chưa phân loại";
  return Number.isInteger(jlpt) && jlpt >= 1 && jlpt <= 5 ? `N${jlpt}` : "—";
}

function GrammarAdminTable({
  grammars,
  page,
  pageSize,
  onDelete,
}: GrammarAdminTableProps) {
  if (grammars.length === 0) {
    return <p role="status">Chưa có dữ liệu ngữ pháp</p>;
  }

  return (
    <div className="grammar-admin-table-wrapper">
      <table>
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã ngữ pháp</th>
            <th>Tên ngữ pháp</th>
            <th>Cấu trúc ngữ pháp</th>
            <th>Ý nghĩa</th>
            <th>Cấp độ JLPT</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {grammars.map((grammar, index) => (
            <tr key={grammar.id}>
              <td>{(page - 1) * pageSize + index + 1}</td>
              <td>{grammar.id}</td>
              <td>
                <Link
                  className="grammar-admin-title-link"
                  to={`/admin/grammar/${grammar.id}`}
                >
                  {grammar.title}
                </Link>
              </td>
              <td lang="ja">{grammar.pattern}</td>
              <td>{grammar.meaning}</td>
              <td>{formatJlpt(grammar.jlpt)}</td>
              <td>
                <Link
                  className="grammar-admin-edit-link"
                  to={`/admin/grammar/${grammar.id}/edit`}
                >
                  Sửa
                </Link>
                <button
                  type="button"
                  className="grammar-admin-delete-button"
                  onClick={() => onDelete(grammar)}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default GrammarAdminTable;
