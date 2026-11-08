import { useEffect, useState } from "react";
import { Link } from "react-router";
import Navbar from "../../../components/Navbar";
import "./DashboardPage.css";
import { useAuth } from "../../../contexts/auth-context";
import {
  fetchDashboardStatistics,
  type DashboardStatistics,
} from "../api";

function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [statistics, setStatistics] =
    useState<DashboardStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;

    setIsLoading(true);
    setErrorMessage("");

    fetchDashboardStatistics()
      .then((result) => {
        if (cancelled) return;
        setStatistics(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu Dashboard.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, refreshKey]);

  if (isAuthLoading) {
    return <main>Đang kiểm tra đăng nhập...</main>;
  }

  if (!user) {
    return (
      <main>
        <p>
          Vui lòng <Link to="/login">đăng nhập</Link> để tiếp tục.
        </p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main>
        <p>Bạn không có quyền truy cập trang này.</p>
        <Link to="/">Về trang chủ</Link>
      </main>
    );
  }

  const statisticCards = statistics
    ? [
        { label: "Tổng người dùng", value: statistics.users.total },
        { label: "Đang hoạt động", value: statistics.users.active },
        { label: "Đã khóa", value: statistics.users.locked },
        { label: "Từ vựng", value: statistics.content.vocabulary },
        { label: "Ngữ pháp", value: statistics.content.grammar },
        { label: "Kanji", value: statistics.content.kanji },
        { label: "Bài đọc", value: statistics.content.reading },
      ]
    : [];

  return (
    <div className="admin-layout">
      <Navbar />

      <main className="admin-main">
        <header className="admin-page-header">
          <div>
            <p className="admin-eyebrow">YUME · QUẢN TRỊ</p>
            <h1>Dashboard</h1>
            <p>Tổng quan tình hình hoạt động của hệ thống.</p>
          </div>

          <button
            type="button"
            onClick={() => setRefreshKey((current) => current + 1)}
            disabled={isLoading}
          >
            Làm mới dữ liệu
          </button>
        </header>

        {isLoading && <p>Đang tải dữ liệu thống kê...</p>}

        {!isLoading && errorMessage && (
          <div role="alert">
            <p>{errorMessage}</p>
            <button
              type="button"
              onClick={() => setRefreshKey((current) => current + 1)}
            >
              Thử lại
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && statistics && (
          <section aria-label="Thống kê hệ thống">
            <h2>Tổng quan hệ thống</h2>

            <div className="dashboard-statistics">
              {statisticCards.map((card) => (
                <article className="dashboard-stat-card" key={card.label}>
                  <h3>{card.label}</h3>
                  <p>{card.value.toLocaleString("vi-VN")}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;