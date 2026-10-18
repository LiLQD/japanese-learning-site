import Navbar from "../components/Navbar";
import "./HomePage.css";

export default function HomePage() {
  return (
    <div className="home-layout">
      <Navbar />

      <main className="home-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Học tiếng Nhật,
              <br />
              từng bước một
            </h1>
            <p className="hero-desc">
              Tra từ, luyện hán tự và ôn ngữ pháp ở cùng một nơi. [Mô tả ngắn
              của sản phẩm]
            </p>
            <div className="hero-actions">
              <button className="btn-primary">Bắt đầu học</button>
              <button className="btn-outline">Tra từ điển</button>
            </div>
          </div>

          <div className="hero-card">
            <div className="card-header">
              <span>Từ ví dụ</span>
              <span className="jlpt-badge jlpt-n5">N5</span>
            </div>
            <h2 className="card-word">勉強</h2>
            <p className="card-reading">べんきょう</p>
            <p className="card-meaning">study; studying</p>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="features-section">
          <div className="feature-card">
            <h3>Từ vựng và hán tự</h3>
            <p>Tra nghĩa, cách đọc và các chữ hán trong từ.</p>
          </div>
          <div className="feature-card">
            <h3>Ngữ pháp và bài đọc</h3>
            <p>Mẫu câu có ví dụ, bài đọc theo cấp độ JLPT.</p>
          </div>
          <div className="feature-card">
            <h3>Ôn tập</h3>
            <p>Thẻ ghi nhớ và bài kiểm tra để theo dõi tiến độ.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
