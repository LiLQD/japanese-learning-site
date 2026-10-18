import { useEffect, useState, type FormEvent } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/auth-context";
import type { ProfileResponse } from "@app/shared";
import { fetchProfile, updateProfile } from "../features/profile/api";
import "./ProfilePage.css";

export default function ProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchProfile()
      .then((data) => {
        setProfile(data.user);
        setDisplayName(data.user.displayName);
      })
      .catch((err) => setMessage({ text: err.message, type: "error" }))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const data = await updateProfile({ displayName });
      setProfile(data.user);
      await refreshUser(); // Cập nhật lại Navbar
      setMessage({ text: "Cập nhật thành công!", type: "success" });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Cập nhật thất bại";
      setMessage({ text: msg, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-layout">
      <Navbar />
      <main className="profile-main">
        <div className="profile-card">
          <h1>Thông tin cá nhân</h1>
          <p className="profile-subtitle">Quản lý thông tin hồ sơ của bạn.</p>

          {message.text && (
            <div className={`profile-alert ${message.type}`}>
              {message.text}
            </div>
          )}

          {isLoading ? (
            <p>Đang tải...</p>
          ) : (
            profile && (
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                  <label>Email (Không thể thay đổi)</label>
                  <input type="email" value={profile.email} disabled />
                </div>

                <div className="form-group">
                  <label htmlFor="displayName">Tên hiển thị</label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={50}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Vai trò</label>
                  <input
                    type="text"
                    value={
                      profile.role === "ADMIN" ? "Quản trị viên" : "Người dùng"
                    }
                    disabled
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSaving}
                  >
                    {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            )
          )}
        </div>
      </main>
    </div>
  );
}
