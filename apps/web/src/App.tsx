import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./features/dashboard/pages/DashboardPage";
import HomePage from "./pages/HomePage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import UserListPage from "./features/users/pages/UserListPage";
import UserDetailPage from "./features/users/pages/UserDetailPage";
import ProfilePage from "./pages/ProfilePage";
import KanjiListPage from "./features/kanji/pages/KanjiListPage";
import KanjiCreatePage from "./features/kanji/pages/KanjiCreatePage";
import KanjiEditPage from "./features/kanji/pages/KanjiEditPage";
import KanjiDetailPage from "./features/kanji/pages/KanjiDetailPage";
import WordLookupPage from "./features/words/pages/WordLookupPage";
import WordDetailPage from "./features/words/pages/WordDetailPage";
import WordEditPage from "./features/words/pages/WordEditPage";
import WordAuthGuard from "./features/words/components/WordAuthGuard";
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
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="/admin/users/:id" element={<UserDetailPage />} />
          <Route path="/kanji" element={<KanjiListPage />} />
          <Route path="/kanji/new" element={<KanjiCreatePage />} />
          <Route path="/kanji/:id/edit" element={<KanjiEditPage />} />
          <Route path="/kanji/:id" element={<KanjiDetailPage />} />
          <Route element={<WordAuthGuard />}>
            <Route path="/words" element={<WordLookupPage />} />
            <Route path="/words/:id" element={<WordDetailPage />} />
            <Route path="/words/:id/edit" element={<WordEditPage />} />
          </Route>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
