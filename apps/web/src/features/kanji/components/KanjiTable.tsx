import type { KanjiListItem } from "@app/shared";

type KanjiTableProps = {
  kanji: KanjiListItem[];
  emptyMessage?: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}

function KanjiTable({
  kanji,
  emptyMessage = "Chưa có dữ liệu Kanji nào trong hệ thống",
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
        </tr>
      </thead>
      <tbody>
        {kanji.map((item) => (
          <tr key={item.id}>
            <td>{item.id}</td>
            <td className="kanji-character" lang="ja">
              {item.character}
            </td>
            <td>{item.strokeCount ?? "—"}</td>
            <td lang="ja">{item.radical ?? "—"}</td>
            <td>{item.jlpt ? `N${item.jlpt}` : "—"}</td>
            <td>{formatDate(item.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default KanjiTable;
