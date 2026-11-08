import type { ErrorResponse } from "@app/shared";

export type DashboardStatistics = {
  users: {
    total: number;
    active: number;
    locked: number;
  };
  content: {
    vocabulary: number;
    grammar: number;
    kanji: number;
    reading: number;
  };
};

type DashboardStatisticsResponse = {
  statistics: DashboardStatistics;
};

export async function fetchDashboardStatistics(): Promise<DashboardStatistics> {
  const response = await fetch("/api/admin/dashboard/statistics", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const data = (await response
      .json()
      .catch(() => null)) as ErrorResponse | null;

    throw new Error(
      data?.error?.message ?? "Không thể tải dữ liệu Dashboard.",
    );
  }

  const data = (await response.json()) as DashboardStatisticsResponse;

  return data.statistics;
}