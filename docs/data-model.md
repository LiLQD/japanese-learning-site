# Data Model

Mô hình dữ liệu của hệ thống học tiếng Nhật. Tài liệu này phản ánh `apps/api/prisma/schema.prisma` và giải thích lý do đằng sau mỗi quyết định thiết kế.

## Tổng quan

Hệ thống gồm bốn nhóm bảng chính:

1. **Tài khoản** — người dùng, phiên đăng nhập, token xác minh
2. **Từ điển** — từ vựng, cách đọc, nghĩa, kanji
3. **Thông báo** — thông báo cho người dùng
4. **Học tập** — từ vựng yêu thích, ngữ pháp, flashcard

## Nhóm 1 — Tài khoản

### `users`

Bảng trung tâm. Mọi thứ khác đều gắn về đây.

| Cột                      | Kiểu           | Ghi chú                                          |
| ------------------------ | -------------- | ------------------------------------------------ |
| `id`                     | SERIAL         | Khóa chính                                       |
| `email`                  | TEXT UNIQUE    | Chuẩn hóa lowercase trước khi lưu                |
| `passwordHash`           | TEXT           | bcryptjs, không bao giờ trả về API               |
| `displayName`            | TEXT           | 1–50 ký tự                                       |
| `avatarKey`              | TEXT NULL      | Tên file trong `uploads/`, không phải URL đầy đủ |
| `role`                   | Role           | `USER` hoặc `ADMIN`                              |
| `status`                 | AccountStatus  | `ACTIVE` hoặc `LOCKED`                           |
| `emailVerifiedAt`        | TIMESTAMP NULL | NULL = chưa xác minh                             |
| `createdAt`, `updatedAt` | TIMESTAMP      |                                                  |

Hai enum: `Role` (hai giá trị) và `AccountStatus` (hai giá trị). Cố ý dùng enum thay vì bảng riêng — với hai giá trị cố định, một bảng join chỉ thêm phức tạp mà không thêm khả năng. Nếu sau này cần nhiều role hơn hoặc phân quyền theo hành động, chuyển thành bảng là một migration đơn giản.

`avatarKey` chỉ lưu tên file, không lưu URL. Khi deploy lên host có ổ đĩa tạm, đổi sang object storage chỉ cần đổi hàm sinh URL, không cần đụng database.

### `sessions`

Phiên đăng nhập. Lưu server-side để có thể thu hồi ngay lập tức.

| Cột         | Kiểu        | Ghi chú               |
| ----------- | ----------- | --------------------- |
| `id`        | SERIAL      |                       |
| `tokenHash` | TEXT UNIQUE | SHA-256 của token thô |
| `userId`    | INTEGER FK  | ON DELETE CASCADE     |
| `expiresAt` | TIMESTAMP   |                       |
| `createdAt` | TIMESTAMP   |                       |

Chỉ lưu hash, không lưu token thô. Token thô đi vào cookie `httpOnly`, không bao giờ vào database.

Index trên `userId` để khi khóa tài khoản, xóa được tất cả session của user bằng một câu lệnh.

### `verification_tokens`

Token dùng một lần cho xác minh email và đặt lại mật khẩu.

| Cột         | Kiểu           | Ghi chú                              |
| ----------- | -------------- | ------------------------------------ |
| `id`        | SERIAL         |                                      |
| `tokenHash` | TEXT UNIQUE    | SHA-256                              |
| `type`      | TokenType      | `EMAIL_VERIFY` hoặc `PASSWORD_RESET` |
| `userId`    | INTEGER FK     | ON DELETE CASCADE                    |
| `expiresAt` | TIMESTAMP      |                                      |
| `usedAt`    | TIMESTAMP NULL | NULL = chưa dùng                     |
| `createdAt` | TIMESTAMP      |                                      |

Cùng nguyên tắc với `sessions`: hash, không lưu token thô. `usedAt` để đảm bảo token chỉ dùng một lần — kiểm tra `usedAt IS NULL` trước khi chấp nhận.

## Nhóm 2 — Từ điển

Bốn thực thể: từ, cách đọc, nghĩa, kanji. Quan hệ nhiều-nhiều giữa từ và kanji qua bảng nối.

### `words`

Đơn vị tra cứu chính.

| Cột                      | Kiểu         | Ghi chú                           |
| ------------------------ | ------------ | --------------------------------- |
| `id`                     | SERIAL       |                                   |
| `text`                   | TEXT         | Cách viết chính (kanji hoặc kana) |
| `jlpt`                   | INTEGER NULL | 1–5, NULL nếu chưa xác định       |
| `createdAt`, `updatedAt` | TIMESTAMP    |                                   |

`text` **không unique**. Đồng âm khác nghĩa có thể trùng kana, và ngay cả kanji cũng có trường hợp trùng. Ràng buộc unique sẽ chặn dữ liệu hợp lệ; code xử lý tốt hơn.

`jlpt` thuộc về từ, không thuộc về nghĩa. Phần lớn từ có một cấp độ duy nhất.

Index trên `text` và `jlpt`.

### `readings`

Cách đọc của từ.

| Cột         | Kiểu       | Ghi chú           |
| ----------- | ---------- | ----------------- |
| `id`        | SERIAL     |                   |
| `wordId`    | INTEGER FK | ON DELETE CASCADE |
| `kana`      | TEXT       | Ví dụ `にほん`    |
| `isPrimary` | BOOLEAN    | Cách đọc chính    |

Ràng buộc `UNIQUE (wordId, kana)`. Một từ có thể có nhiều cách đọc, và có thể có nhiều cách đọc chính trong trường hợp hiếm — không ràng buộc `isPrimary`.

Index trên `kana` vì tìm kiếm theo cách đọc là một trong ba cách tra cứu chính.

### `senses`

Một nghĩa của từ.

| Cột            | Kiểu       | Ghi chú                             |
| -------------- | ---------- | ----------------------------------- |
| `id`           | SERIAL     |                                     |
| `wordId`       | INTEGER FK | ON DELETE CASCADE                   |
| `partOfSpeech` | TEXT[]     | Mã JMdict: `n`, `v1`, `adj-i`, v.v. |
| `position`     | INTEGER    | Thứ tự nghĩa                        |

`partOfSpeech` là mảng vì một nghĩa có thể vừa là noun vừa là verb. Dùng mảng thay vì enum vì JMdict có khoảng ba mươi mã và có thể thay đổi; enum sẽ phải migrate mỗi lần.

`position` giữ thứ tự nghĩa như trong nguồn dữ liệu.

### `glosses`

Bản dịch của một nghĩa.

| Cột       | Kiểu       | Ghi chú                     |
| --------- | ---------- | --------------------------- |
| `id`      | SERIAL     |                             |
| `senseId` | INTEGER FK | ON DELETE CASCADE           |
| `lang`    | TEXT       | ISO 639-1: `en`, `vi`, v.v. |
| `text`    | TEXT       | Nội dung, ví dụ `to open`   |

Thêm gloss tiếng Việt sau này chỉ là thêm row với `lang = 'vi'`. Không đổi schema.

### `kanji`

Ký tự Hán tự riêng lẻ.

| Cột                      | Kiểu         | Ghi chú                                    |
| ------------------------ | ------------ | ------------------------------------------ |
| `id`                     | SERIAL       |                                            |
| `character`              | TEXT UNIQUE  | Một ký tự duy nhất                         |
| `strokeCount`            | INTEGER NULL | Số nét                                     |
| `radical`                | TEXT NULL    | Bộ thủ                                     |
| `jlpt`                   | INTEGER NULL | Cấp độ của kanji (khác cấp của từ chứa nó) |
| `grade`                  | INTEGER NULL | Cấp học phổ thông Nhật                     |
| `createdAt`, `updatedAt` | TIMESTAMP    |                                            |

Tách khỏi `words` vì kanji có thuộc tính riêng (số nét, bộ thủ) và có thể học độc lập. Nếu gộp vào `words`, không có thực thể để gắn tiến độ học kanji.

### `word_kanji`

Bảng nối giữa từ và kanji.

| Cột        | Kiểu       | Ghi chú         |
| ---------- | ---------- | --------------- |
| `wordId`   | INTEGER FK |                 |
| `kanjiId`  | INTEGER FK |                 |
| `position` | INTEGER    | Vị trí trong từ |

Khóa chính tổng hợp `(wordId, position)`, không phải `(wordId, kanjiId)`. Lý do: một từ có thể dùng cùng một kanji nhiều lần, và khi đó cần phân biệt bằng vị trí.

Index trên `kanjiId` để tra cứu ngược: một kanji xuất hiện trong những từ nào.

## Nhóm 3 — Thông báo

### `notifications`

| Cột         | Kiểu           | Ghi chú                                  |
| ----------- | -------------- | ---------------------------------------- |
| `id`        | SERIAL         |                                          |
| `userId`    | INTEGER FK     | ON DELETE CASCADE                        |
| `type`      | TEXT           | Ví dụ `EMAIL_VERIFIED`, `ACCOUNT_LOCKED` |
| `payload`   | JSONB          | Nội dung tùy theo `type`                 |
| `readAt`    | TIMESTAMP NULL | NULL = chưa đọc                          |
| `createdAt` | TIMESTAMP      |                                          |

`type` là TEXT chứ không phải enum vì số loại thông báo sẽ tăng khi hệ thống mở rộng, và một enum cứng sẽ phải migrate mỗi lần thêm loại mới.

`payload` là JSONB vì mỗi loại thông báo cần dữ liệu khác nhau. Ví dụ:

- `EMAIL_VERIFIED` → `{ verifiedAt: "..." }`
- `ACCOUNT_LOCKED` → `{ reason: "..." }`

Index tổng hợp `(userId, readAt)` để câu truy vấn "đếm thông báo chưa đọc của user" chạy nhanh.

## Nhóm 4 — Học tập

### `favorite_words`

Từ vựng người dùng đã lưu.

| Cột         | Kiểu       | Ghi chú           |
| ----------- | ---------- | ----------------- |
| `id`        | SERIAL     |                   |
| `userId`    | INTEGER FK | ON DELETE CASCADE |
| `wordId`    | INTEGER FK | ON DELETE CASCADE |
| `createdAt` | TIMESTAMP  |                   |

Ràng buộc `UNIQUE (userId, wordId)` — không yêu thích cùng một từ hai lần.

### `grammars`

Cấu trúc ngữ pháp.

| Cột                      | Kiểu         | Ghi chú                        |
| ------------------------ | ------------ | ------------------------------ |
| `id`                     | SERIAL       |                                |
| `title`                  | TEXT         | Tên hiển thị, ví dụ `～ている` |
| `pattern`                | TEXT         | Cấu trúc, ví dụ `V-て + いる`  |
| `meaning`                | TEXT         | Giải thích                     |
| `jlpt`                   | INTEGER NULL |                                |
| `createdAt`, `updatedAt` | TIMESTAMP    |                                |

### `grammar_examples`

Ví dụ cho một cấu trúc ngữ pháp.

| Cột         | Kiểu       | Ghi chú            |
| ----------- | ---------- | ------------------ |
| `id`        | SERIAL     |                    |
| `grammarId` | INTEGER FK | ON DELETE CASCADE  |
| `japanese`  | TEXT       | Câu tiếng Nhật     |
| `reading`   | TEXT NULL  | Cách đọc bằng kana |
| `english`   | TEXT       | Bản dịch           |
| `position`  | INTEGER    | Thứ tự             |

### `flashcard_decks`

Bộ flashcard của người dùng.

| Cột                      | Kiểu       | Ghi chú           |
| ------------------------ | ---------- | ----------------- |
| `id`                     | SERIAL     |                   |
| `userId`                 | INTEGER FK | ON DELETE CASCADE |
| `name`                   | TEXT       |                   |
| `description`            | TEXT NULL  |                   |
| `createdAt`, `updatedAt` | TIMESTAMP  |                   |

### `flashcards`

Thẻ trong một bộ.

| Cột                      | Kiểu       | Ghi chú           |
| ------------------------ | ---------- | ----------------- |
| `id`                     | SERIAL     |                   |
| `deckId`                 | INTEGER FK | ON DELETE CASCADE |
| `front`                  | TEXT       | Mặt trước         |
| `back`                   | TEXT       | Mặt sau           |
| `position`               | INTEGER    | Thứ tự trong bộ   |
| `createdAt`, `updatedAt` | TIMESTAMP  |                   |

## Chiến lược tìm kiếm

Người dùng tra cứu theo ba cách:

**Theo cách viết** — `words.text LIKE '%q%'`. Index thường trên `text` đủ cho giai đoạn đầu.

**Theo cách đọc** — join `words` với `readings`, tìm trên `readings.kana`. Index trên `kana`.

**Theo nghĩa** — join `words → senses → glosses`, tìm trên `glosses.text` với `lang = 'en'`. Index trên `glosses.text`.

Khi dataset đạt khoảng 200.000 từ (kích thước của JMdict), cân nhắc `pg_trgm` hoặc `tsvector` cho cả ba trường hợp. Ở quy mô đồ án, `LIKE` là đủ.

## Nguồn dữ liệu

Hai nguồn, cùng license EDRDG:

- **jmdict-simplified** — JMdict dạng JSON. Cung cấp dữ liệu cho `words`, `readings`, `senses`, `glosses`.
- **kanjidic2** — dạng JSON. Cung cấp dữ liệu cho `kanji`.

Dữ liệu thô không commit vào Git — file JSON của JMdict nặng hàng chục MB. Import qua script seed, không qua migration.
