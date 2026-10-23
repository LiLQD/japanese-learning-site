# Japanese Learning Site (YUME)

Ứng dụng web hỗ trợ học tiếng Nhật toàn diện: từ điển, từ vựng, kanji, ngữ pháp và flashcard.

Dự án được phát triển trong 10 tuần theo quy trình Agile/Scrum, chia thành 4 Sprint.

## Tech Stack

**Frontend**

- React + TypeScript + Vite
- React Router
- TanStack Query

**Backend**

- Node.js + Express 5
- TypeScript
- Prisma 7 + PostgreSQL 17
- Helmet

**Shared**

- Zod (Schema dùng chung giữa web và api)

**Testing & Tooling**

- Vitest, Supertest
- ESLint, Prettier
- GitHub Actions CI

**Dev Services**

- PostgreSQL 17 (Docker)
- Mailpit (SMTP local cho email)

## Yêu cầu môi trường

- Node.js 24
- pnpm (xem trường `packageManager` trong `package.json`)
- Docker + Docker Compose

Kiểm tra môi trường:

```bash
node --version
pnpm --version
docker compose version
```

## 🛠 Hướng dẫn Cài đặt & Khởi chạy

### 1. Cài đặt lần đầu (Chỉ chạy 1 lần duy nhất)

Khi mới clone dự án về máy, bạn cần chạy các lệnh sau để thiết lập môi trường:

```bash
# Cài dependencies
pnpm install

# Tạo file môi trường
cp apps/api/.env.example apps/api/.env

# Khởi động Database & Mailpit
docker compose up -d

# Tạo bảng trong Database (Migration)
pnpm db:migrate

# Nạp dữ liệu mẫu (Seed Data: 2 users, 20 từ vựng)
pnpm db:seed
```

### 2. Chạy lại nhiều lần

Sau khi đã cài đặt xong ở bước 1, mỗi lần muốn code, cần chạy:

```bash
# Đảm bảo Docker đang chạy (nếu máy đã khởi động lại)
docker compose up -d

# Chạy song song cả Web và API
pnpm dev
```

**Các đường dẫn truy cập:**

| Dịch vụ    | URL                              |
| ---------- | -------------------------------- |
| Web App    | http://localhost:5173            |
| API Health | http://localhost:3000/api/health |
| Mailpit UI | http://localhost:8025            |

_Lưu ý: Nếu bạn có thay đổi cấu trúc Database (sửa file `schema.prisma`), hãy nhớ chạy `pnpm db:migrate` lại._

---

## Kiểm tra trước khi commit (Bắt buộc)

Trước khi tạo Pull Request, luôn chạy 2 lệnh sau để đảm bảo code không làm hỏng CI:

```bash
pnpm format
pnpm check
```

_(Lệnh `pnpm check` sẽ chạy: format check, lint, typecheck, test và build)._

## Scripts có sẵn

| Lệnh               | Mô tả                               |
| ------------------ | ----------------------------------- |
| `pnpm dev`         | Chạy web và api song song           |
| `pnpm build`       | Build production cho tất cả package |
| `pnpm test`        | Chạy test                           |
| `pnpm lint`        | Chạy ESLint                         |
| `pnpm typecheck`   | Kiểm tra TypeScript                 |
| `pnpm format`      | Format code bằng Prettier           |
| `pnpm check`       | Chạy toàn bộ kiểm tra (giống CI)    |
| `pnpm db:up`       | Khởi động PostgreSQL                |
| `pnpm db:migrate`  | Tạo và áp dụng migration mới        |
| `pnpm db:generate` | Sinh Prisma Client                  |
| `pnpm db:seed`     | Nạp dữ liệu mẫu                     |

## Cấu trúc Repository

```text
apps/
  web/       # React + Vite frontend
  api/       # Express + Prisma backend
packages/
  shared/    # Zod schemas và TypeScript types dùng chung
docs/        # Tài liệu thiết kế hệ thống
```

Chi tiết mô hình dữ liệu: xem [docs/data-model.md](./docs/data-model.md).
Quy trình làm việc nhóm: xem [CONTRIBUTING.md](./CONTRIBUTING.md).

## Phạm vi Dự án (Scope)

Hệ thống tập trung vào các **Tính năng cốt lõi (Core Features)**:

- **Tài khoản:** Đăng ký, Đăng nhập, Phân quyền, Hồ sơ cá nhân, Avatar, Đổi mật khẩu.
- **Tương tác:** Hệ thống thông báo (Notifications).
- **Quản trị (Admin):** Quản lý danh sách người dùng, khóa/mở khóa tài khoản.
- **Học tập:** Tra cứu Từ vựng, Kanji, Ngữ pháp, Hệ thống Flashcard.

_(Ghi chú: Các tính năng như Quiz, Bài đọc, Chat, Thanh toán và AI không nằm trong phạm vi của phiên bản này)._

## License

Mã nguồn phát triển cho mục đích học tập.

Dữ liệu từ điển (khi được import) lấy từ hai nguồn thuộc Electronic Dictionary Research and Development Group (EDRDG):

- [JMdict](https://www.edrdg.org/jmdict/j_jmdict.html) — từ điển Nhật–Anh
- [KANJIDIC2](https://www.edrdg.org/wiki/index.php/KANJIDIC_Project) — từ điển Hán tự

License của EDRDG cho phép sử dụng, sao chép và phân phối lại, kể cả cho mục đích thương mại, với điều kiện phải ghi công EDRDG trong tài liệu sản phẩm.
