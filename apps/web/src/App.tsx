import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import UserListPage from "./features/users/pages/UserListPage";
import UserDetailPage from "./features/users/pages/UserDetailPage";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/admin/users" element={<UserListPage />} />
          <Route path="/admin/users/:id" element={<UserDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
