# Japanese Learning Site

Ứng dụng web hỗ trợ học tiếng Nhật.

## Tech Stack

- React + TypeScript + Vite
- Express + TypeScript
- Zod
- PostgreSQL
- pnpm workspace

## 1. Clone repository

```bash
git clone git@github.com:LiLQD/japanese-learning-site.git
cd japanese-learning-site
```

## 2. Cài đặt môi trường

Yêu cầu:

- Node.js
- pnpm 12
- Docker + Docker Compose

Kiểm tra:

```bash
node --version
pnpm --version
docker --version
docker compose version
```

Cài dependencies:

```bash
pnpm install
```

Tạo file môi trường:

```bash
cp .env.example .env
```

## 3. Chạy project

Khởi động PostgreSQL:

```bash
docker compose up -d
```

Khởi động web và API:

```bash
pnpm dev
```

Web: `http://localhost:5173`

API: `http://localhost:3000`

Health check:

```bash
curl http://localhost:3000/api/health
```

## 4. Trước khi tạo PR

Chạy các kiểm tra:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Tất cả phải pass trước khi tạo Pull Request.

## 5. Tạo branch

Không làm việc trực tiếp trên `main`.

Cập nhật `main` trước:

```bash
git switch main
git pull
```

Tạo branch mới:

```bash
git switch -c feat/ten-tinh-nang
```

Ví dụ:

```bash
git switch -c feat/dictionary-search
```

## 6. Commit

```bash
git status
git add -A
git commit -m "feat: add dictionary search"
```

Các prefix thường dùng:

- `feat:` — tính năng mới
- `fix:` — sửa lỗi
- `refactor:` — refactor code
- `test:` — thêm hoặc sửa test
- `docs:` — documentation
- `chore:` — cấu hình/tooling

## 7. Push và tạo Pull Request

```bash
git push -u origin HEAD
gh pr create --fill
```

Trong PR nên ghi rõ:

- Đã thay đổi gì
- Vì sao cần thay đổi
- Đã test như thế nào
- Issue liên quan, nếu có

## 8. Review và merge

Theo dõi CI:

```bash
gh pr checks --watch
```

Chờ CI pass và reviewer review trước khi merge.

## Project Structure

```text
apps/
  web/       # Frontend
  api/       # Backend API

packages/
  shared/    # Shared schemas và types
```
