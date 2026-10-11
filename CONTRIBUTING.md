# Hướng dẫn đóng góp

Tài liệu này quy định cách làm việc với repository. Mọi thành viên phải đọc trước khi tạo pull request đầu tiên.

## Yêu cầu môi trường

- Node.js 24 (xem `.github/workflows/ci.yml`)
- pnpm (xem trường `packageManager` trong `package.json`)
- Docker + Docker Compose

Kiểm tra:

    node --version
    pnpm --version
    docker compose version

## Cài đặt lần đầu

    git clone git@github.com:LiLQD/japanese-learning-site.git
    cd japanese-learning-site
    pnpm install
    cp apps/api/.env.example apps/api/.env
    docker compose up -d
    pnpm db:migrate
    pnpm db:generate

Chạy dev:

    pnpm dev

- Web: http://localhost:5173
- API: http://localhost:3000
- Mailpit UI: http://localhost:8025

## Quy trình branch

**Luôn tạo branch mới từ `main` đã cập nhật.** Không bao giờ tạo branch mới khi đang đứng trên branch khác — PR sẽ chứa cả công việc chưa merge của branch cũ.

    git switch main
    git pull
    git switch -c feat/us-01-dang-ky

Đặt tên branch:

    <loại>/us-<số>-<mô-tả-ngắn>

Ví dụ:

    feat/us-01-dang-ky
    fix/us-04-sai-mat-khau
    docs/update-readme
    chore/add-mailpit

Các loại:

- `feat/` — tính năng mới
- `fix/` — sửa lỗi
- `docs/` — tài liệu
- `chore/` — cấu hình, tooling
- `test/` — test
- `refactor/` — tái cấu trúc

## Commit

Format:

    <loại>: <mô tả ngắn>

Ví dụ:

    feat: add POST /api/auth/register
    fix: hash password before storing
    docs: add CONTRIBUTING.md

Không commit trực tiếp lên `main`. Mọi thay đổi đi qua pull request.

## Trước khi commit

Chạy hai lệnh này, theo đúng thứ tự:

    pnpm format
    pnpm check

`pnpm format` tự sửa format. `pnpm check` chạy đúng những gì CI chạy: format check, lint, typecheck, test, build. Nếu `pnpm check` đỏ, sửa rồi chạy lại. **Không push khi `pnpm check` còn đỏ** — CI sẽ đỏ và PR bị chặn.

## Xử lý conflict `pnpm-lock.yaml`

**Không bao giờ sửa `pnpm-lock.yaml` bằng tay.**

Khi conflict xảy ra:

1. Giải quyết `package.json` trước, chọn đúng dependency cần giữ.
2. Chọn bản của `main` cho `pnpm-lock.yaml`:
   
       git checkout --theirs pnpm-lock.yaml

3. Chạy lại để sinh lock file mới:
   
       pnpm install

4. Commit kết quả.

## Pull request

Tạo PR:

    git push -u origin HEAD
    gh pr create --fill

Tiêu đề PR theo cùng format commit: `<loại>: <mô tả>`.

Trong phần mô tả PR, ghi rõ:

- Đã thay đổi gì
- Vì sao cần thay đổi
- Cách kiểm thử (các bước cụ thể)
- `Closes #<số issue>` để tự đóng issue khi merge

Ví dụ:

    ## Thay đổi
    Thêm POST /api/auth/register với validation Zod và hash bcryptjs.

    ## Vì sao
    US-01 yêu cầu người dùng đăng ký tài khoản.

    ## Cách kiểm thử
    1. docker compose up -d
    2. pnpm db:migrate && pnpm db:generate
    3. pnpm dev
    4. curl -X POST localhost:3000/api/auth/register -H 'Content-Type: application/json' -d '{"email":"a@b.com","password":"12345678","displayName":"A"}'
    5. Kiểm tra DB có row trong bảng users

    Closes #6

## Review và merge

Mọi PR cần **chủ repo phê duyệt** trước khi merge.

Theo dõi CI:

    gh pr checks --watch

Chờ CI xanh và approval. Sau đó merge bằng squash:

    gh pr merge --squash --delete-branch

Squash để mỗi PR thành một commit trên `main`, giữ history sạch.

## Bảo mật

- **Không commit `.env`.** File này đã được gitignore.
- **Không commit `apps/api/generated/`.** Prisma Client sinh tự động.
- **Không hardcode secret** trong code. Đọc từ `process.env`.
- Biến môi trường mới phải thêm vào `apps/api/.env.example` trước khi dùng.

## Cấu trúc repository

    apps/
      web/       # React + Vite
      api/       # Express + Prisma
    packages/
      shared/    # Zod schemas dùng chung

Schema dùng chung giữa web và api đặt trong `packages/shared/src/`. Import bằng `@app/shared`.

## Câu hỏi

Nếu gặp vấn đề không có trong tài liệu này, hỏi trong nhóm chat trước khi tự quyết định. Quy tắc chung: nếu một việc có thể làm theo nhiều cách và không rõ cách nào đúng, hỏi.
