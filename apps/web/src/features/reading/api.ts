import type { ReadingInput } from "@app/shared";

export interface ReadingPassage {
  id: number;
  title: string;
  jlpt: number | null;
}

export interface ReadingListResponse {
  passages: ReadingPassage[];
}

export interface ReadingPassageDetail extends ReadingPassage {
  content: string;
  translation: string | null;
}

export interface ReadingDetailResponse {
  passage: ReadingPassageDetail;
}

export interface ReadingQuestion {
  id: number;
  question: string;
  options: string[];
  position: number;
}

export interface ReadingQuestionsResponse {
  success: boolean;
  questions: ReadingQuestion[];
}

export interface ReadingAnswer {
  questionId: number;
  selectedOption: number;
}

export interface ReadingResult {
  id: number;
  userId: number;
  passageId: number;
  score: number;
  correctCount: number;
  totalCount: number;
  timeSpent: number;
}

export interface ReadingResultDetail {
  questionId: number;
  selectedOption: number;
  isCorrect: boolean;
}

export interface ReadingSubmitResponse {
  success: boolean;
  data: {
    result: ReadingResult;
    details: ReadingResultDetail[];
  };
}

/**
 * Đọc thông báo lỗi trả về từ API.
 */
async function getApiErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = await response.json();
    return data?.message || data?.error?.message || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Lấy danh sách bài đọc.
 * GET /api/reading
 */
export async function fetchReadingList(): Promise<ReadingListResponse> {
  let response: Response;

  try {
    response = await fetch("/api/reading", {
      method: "GET",
      credentials: "include",
    });
  } catch {
    throw new Error("Không thể kết nối đến máy chủ.");
  }

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "Không thể tải danh sách bài đọc."),
    );
  }

  return (await response.json()) as ReadingListResponse;
}

/**
 * Lấy chi tiết bài đọc.
 * GET /api/reading/:id
 */
export async function fetchReadingDetail(
  id: number,
): Promise<ReadingDetailResponse> {
  let response: Response;

  try {
    response = await fetch(`/api/reading/${id}`, {
      method: "GET",
      credentials: "include",
    });
  } catch {
    throw new Error("Không thể kết nối đến máy chủ.");
  }

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(
        response,
        response.status === 404
          ? "Không tìm thấy bài đọc."
          : "Không thể tải nội dung bài đọc.",
      ),
    );
  }

  return (await response.json()) as ReadingDetailResponse;
}

/**
 * Lấy danh sách câu hỏi của bài đọc.
 * GET /api/reading/:id/questions
 */
export async function fetchReadingQuestions(
  passageId: number,
): Promise<ReadingQuestionsResponse> {
  let response: Response;

  try {
    response = await fetch(`/api/reading/${passageId}/questions`, {
      method: "GET",
      credentials: "include",
    });
  } catch {
    throw new Error("Không thể kết nối đến máy chủ.");
  }

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "Không thể tải câu hỏi đọc hiểu."),
    );
  }

  return (await response.json()) as ReadingQuestionsResponse;
}

/**
 * Nộp bài đọc hiểu.
 * POST /api/reading/submit
 *
 * userId được backend lấy từ phiên đăng nhập,
 * frontend không gửi userId.
 */
export async function submitReadingQuiz(
  passageId: number,
  timeSpent: number,
  answers: ReadingAnswer[],
): Promise<ReadingSubmitResponse> {
  let response: Response;

  try {
    response = await fetch("/api/reading/submit", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        passageId,
        timeSpent,
        answers,
      }),
    });
  } catch {
    throw new Error("Không thể kết nối đến máy chủ.");
  }

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(
        response,
        response.status === 401
          ? "Vui lòng đăng nhập để nộp bài."
          : "Không thể nộp bài. Vui lòng thử lại.",
      ),
    );
  }

  return (await response.json()) as ReadingSubmitResponse;
}

// ADMIN
export async function createReading(data: ReadingInput): Promise<void> {
  const res = await fetch("/api/reading", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || "Thêm bài đọc thất bại.");
  }
}

export async function updateReading(
  id: number,
  data: ReadingInput,
): Promise<void> {
  const res = await fetch(`/api/reading/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || "Cập nhật bài đọc thất bại.");
  }
}

export async function deleteReading(id: number): Promise<void> {
  const res = await fetch(`/api/reading/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || "Xóa bài đọc thất bại.");
  }
}
