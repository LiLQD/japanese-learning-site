import multer from "multer";
import path from "node:path";
import fs from "node:fs";

// Tạo thư mục uploads nếu chưa có
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Đặt tên file: <userId>-<timestamp>.<ext> để tránh trùng
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${req.user!.id}-${Date.now()}${ext}`;
    cb(null, uniqueSuffix);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Giới hạn 2MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh (jpeg, png, webp)"));
    }
  },
});
