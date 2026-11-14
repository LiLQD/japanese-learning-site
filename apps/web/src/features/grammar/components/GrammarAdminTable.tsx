import type { GrammarListItem } from "@app/shared";

type GrammarAdminTableProps = {
  grammars: GrammarListItem[];
  page: number;
  pageSize: number;
};

function formatJlpt(jlpt: number | null) {
  return Number.isInteger(jlpt) && jlpt !== null && jlpt >= 1 && jlpt <= 5
    ? `N${jlpt}`
    : "—";
}

function GrammarAdminTable({
  grammars,
  page,
  pageSize,
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
          </tr>
        </thead>
        <tbody>
          {grammars.map((grammar, index) => (
            <tr key={grammar.id}>
              <td>{(page - 1) * pageSize + index + 1}</td>
              <td>{grammar.id}</td>
              <td>{grammar.title}</td>
              <td lang="ja">{grammar.pattern}</td>
              <td>{grammar.meaning}</td>
              <td>{formatJlpt(grammar.jlpt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default GrammarAdminTable;
