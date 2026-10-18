import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: false,
});

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const baseUrl = process.env.WEB_BASE_URL ?? "http://localhost:5173";

  const verificationUrl = new URL("/verify-email", baseUrl);
  verificationUrl.searchParams.set("token", token);

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "noreply@localhost",
    to,
    subject: "Xác minh địa chỉ email",
    text: [
      "Xin chào!",
      "Vui lòng mở liên kết sau để xác minh email của bạn:",
      verificationUrl.toString(),
      "Liên kết có hiệu lực trong 30 phút.",
    ].join("\n"),
    html: `
      <p>Xin chào!</p>
      <p>Vui lòng nhấn liên kết bên dưới để xác minh email:</p>
      <p>
        <a href="${verificationUrl.toString()}">
          Xác minh email
        </a>
      </p>
      <p>Liên kết có hiệu lực trong 30 phút.</p>
    `,
  });
}
