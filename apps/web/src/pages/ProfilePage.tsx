import { useEffect, useState, type FormEvent } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/auth-context";
import type { ProfileResponse } from "@app/shared";
import {
  fetchProfile,
  updateProfile,
  changePassword,
} from "../features/profile/api";
import "./ProfilePage.css";

export default function ProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // State cho form Cập nhật thông tin
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: "", type: "" });

  // State cho form Đổi mật khẩu
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchProfile()
      .then((data) => {
        setProfile(data.user);
        setDisplayName(data.user.displayName);
      })
      .catch((err) => setProfileMsg({ text: err.message, type: "error" }))
      .finally(() => setIsLoading(false));
  }, []);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg({ text: "", type: "" });

    try {
      const data = await updateProfile({ displayName });
      setProfile(data.user);
      await refreshUser();
      setProfileMsg({ text: "Cập nhật thành công!", type: "success" });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Cập nhật thất bại";
      setProfileMsg({ text: msg, type: "error" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: "Mật khẩu xác nhận không khớp", type: "error" });
      return;
    }

    setIsSavingPassword(true);
    setPasswordMsg({ text: "", type: "" });

    try {
      await changePassword({ oldPassword, newPassword });
      setPasswordMsg({ text: "Đổi mật khẩu thành công!", type: "success" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Đổi mật khẩu thất bại";
      setPasswordMsg({ text: msg, type: "error" });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="profile-layout">
      <Navbar />
      <main className="profile-main">
        <div className="profile-card">
          <h1>Thông tin cá nhân</h1>
          <p className="profile-subtitle">Quản lý thông tin hồ sơ của bạn.</p>

          {profileMsg.text && (
            <div className={`profile-alert ${profileMsg.type}`}>
              {profileMsg.text}
            </div>
          )}

          {isLoading ? (
            <p>Đang tải...</p>
          ) : (
            profile && (
              <form onSubmit={handleUpdateProfile} className="profile-form">
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
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            )
          )}
        </div>

        {/* FORM ĐỔI MẬT KHẨU */}
        <div className="profile-card" style={{ marginTop: "32px" }}>
          <h2>Đổi mật khẩu</h2>
          <p className="profile-subtitle">
            Bảo vệ tài khoản bằng mật khẩu mạnh.
          </p>

          {passwordMsg.text && (
            <div className={`profile-alert ${passwordMsg.type}`}>
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="profile-form">
            <div className="form-group">
              <label htmlFor="oldPassword">Mật khẩu hiện tại</label>
              <input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">
                Mật khẩu mới (ít nhất 8 ký tự)
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={isSavingPassword}
              >
                {isSavingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
