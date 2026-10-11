# Japanese Learning Site

Ứng dụng web hỗ trợ học tiếng Nhật: từ vựng, kanji, ngữ pháp, từ điển, flashcard, quiz và các bài luyện tập.

Dự án đang trong giai đoạn xây dựng, phát triển theo 4 sprint trong 10 tuần.

## Tech stack

**Frontend**

- React + TypeScript + Vite
- React Router
- TanStack Query
- Tailwind CSS

**Backend**

- Node.js + Express 5
- TypeScript
- Prisma 7 + PostgreSQL 17
- Helmet

**Shared**

- Zod (schema dùng chung giữa web và api)

**Testing & tooling**

- Vitest, Supertest
- ESLint, Prettier
- TypeScript
- GitHub Actions CI

**Dev services**

- PostgreSQL 17 (Docker)
- Mailpit (SMTP local cho email)

## Yêu cầu

- Node.js 24
- pnpm (xem trường `packageManager` trong `package.json`)
- Docker + Docker Compose
- Git

Kiểm tra:

    node --version
    pnpm --version
    docker compose version

## Cài đặt

Clone repository:

    git clone git@github.com:LiLQD/japanese-learning-site.git
    cd japanese-learning-site

Cài dependencies:

    pnpm install

Tạo file môi trường:

    cp apps/api/.env.example apps/api/.env

Khởi động PostgreSQL và Mailpit:

    docker compose up -d

Chạy migration và sinh Prisma Client:

    pnpm db:migrate
    pnpm db:generate

Nạp dữ liệu mẫu:

    pnpm db:seed

Seed tạo sẵn:

- Admin: `admin@localhost` / `admin1234`
- User: `user@localhost` / `user1234`
- 20 từ tiếng Nhật mẫu có readings, senses và glosses

## Chạy dự án

    pnpm dev

Các dịch vụ:

| Dịch vụ    | URL                                                  |
| ---------- | ---------------------------------------------------- |
| Web        | http://localhost:5173                                |
| API        | http://localhost:3000                                |
| API health | http://localhost:3000/api/health                     |
| Mailpit UI | http://localhost:8025                                |
| PostgreSQL | localhost:5432 (user/password/db: `app`/`app`/`app`) |

Vite dev server proxy `/api/*` sang API ở cổng 3000, nên frontend có thể gọi đường dẫn tương đối.

## Kiểm tra trước khi commit

    pnpm format
    pnpm check

`pnpm format` tự sửa format. `pnpm check` chạy đúng những gì CI chạy: format check, lint, typecheck, test, build. Cả hai phải xanh trước khi tạo pull request.

Chi tiết quy trình làm việc, đặt tên branch, commit message và quy tắc review: xem [CONTRIBUTING.md](./CONTRIBUTING.md).

## Scripts

| Lệnh               | Mô tả                               |
| ------------------ | ----------------------------------- |
| `pnpm dev`         | Chạy web và api song song           |
| `pnpm build`       | Build production cho tất cả package |
| `pnpm test`        | Chạy test                           |
| `pnpm lint`        | Chạy ESLint                         |
| `pnpm typecheck`   | Kiểm tra TypeScript                 |
| `pnpm format`      | Format code bằng Prettier           |
| `pnpm check`       | Chạy toàn bộ kiểm tra (giống CI)    |
| `pnpm db:up`       | Chỉ khởi động PostgreSQL            |
| `pnpm db:migrate`  | Tạo và áp dụng migration mới        |
| `pnpm db:generate` | Sinh Prisma Client                  |
| `pnpm db:seed`     | Nạp dữ liệu mẫu                     |

## Cấu trúc repository

    apps/
      web/       # React + Vite frontend
      api/       # Express + Prisma backend
    packages/
      shared/    # Zod schemas và TypeScript types dùng chung
    docs/        # Tài liệu thiết kế

Chi tiết mô hình dữ liệu: xem [docs/data-model.md](./docs/data-model.md).

## Cấu trúc dữ liệu

Hệ thống có bốn nhóm bảng:

- **Tài khoản**: `users`, `sessions`, `verification_tokens`
- **Từ điển**: `words`, `readings`, `senses`, `glosses`, `kanji`, `word_kanji`
- **Thông báo**: `notifications`
- **Học tập**: `favorite_words`, `grammars`, `grammar_examples`, `reading_passages`, `reading_questions`, `flashcard_decks`, `flashcards`

Bảng cho thanh toán, chat, quiz và báo cáo sẽ được thêm ở các sprint sau.

## License và ghi công

Mã nguồn phát triển cho mục đích học tập.

Dữ liệu từ điển (khi được import ở Sprint 2) sẽ lấy từ hai nguồn thuộc Electronic Dictionary Research and Development Group (EDRDG):

- [JMdict](https://www.edrdg.org/jmdict/j_jmdict.html) — từ điển Nhật–Anh
- [KANJIDIC2](https://www.edrdg.org/wiki/index.php/KANJIDIC_Project) — từ điển Hán tự

Nguồn JSON: [jmdict-simplified](https://github.com/scriptin/jmdict-simplified)

License của EDRDG cho phép sử dụng, sao chép và phân phối lại, kể cả cho mục đích thương mại, với điều kiện phải ghi công EDRDG trong tài liệu sản phẩm. Chi tiết đầy đủ: [edrdg.org/edrdg/licence.html](http://www.edrdg.org/edrdg/licence.html).
