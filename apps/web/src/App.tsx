import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./features/dashboard/pages/DashboardPage";
import HomePage from "./pages/HomePage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import UserListPage from "./features/users/pages/UserListPage";
import UserDetailPage from "./features/users/pages/UserDetailPage";
import GrammarAdminPage from "./features/grammar/pages/GrammarAdminPage";
import GrammarAdminDetailPage from "./features/grammar/pages/GrammarAdminDetailPage";
import GrammarCreatePage from "./features/grammar/pages/GrammarCreatePage";
import GrammarEditPage from "./features/grammar/pages/GrammarEditPage";
import ProfilePage from "./pages/ProfilePage";
import GrammarListPage from "./features/grammar/pages/GrammarListPage";
import GrammarDetailPage from "./features/grammar/pages/GrammarDetailPage";
import KanjiListPage from "./features/kanji/pages/KanjiListPage";
import KanjiCreatePage from "./features/kanji/pages/KanjiCreatePage";
import KanjiEditPage from "./features/kanji/pages/KanjiEditPage";
import KanjiDetailPage from "./features/kanji/pages/KanjiDetailPage";
import WordLookupPage from "./features/words/pages/WordLookupPage";
import WordDetailPage from "./features/words/pages/WordDetailPage";
import WordEditPage from "./features/words/pages/WordEditPage";
import WordAuthGuard from "./features/words/components/WordAuthGuard";
import ReadingListPage from "./features/reading/pages/ReadingListPage";
import ReadingDetailPage from "./features/reading/pages/ReadingDetailPage";
import ReadingQuizPage from "./features/reading/pages/ReadingQuizPage";
import ReadingResultPage from "./features/reading/pages/ReadingResultPage";
import ReadingCreatePage from "./features/reading/pages/ReadingCreatePage";
import ReadingEditPage from "./features/reading/pages/ReadingEditPage";
import FlashcardDeckListPage from "./features/flashcards/pages/FlashcardDeckListPage";
import FlashcardDeckPage from "./features/flashcards/pages/FlashcardDeckPage";
import FlashcardAuthGuard from "./features/flashcards/components/FlashcardAuthGuard";
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
          <Route path="/admin/grammar" element={<GrammarAdminPage />} />
          <Route path="/admin/grammar/create" element={<GrammarCreatePage />} />
          <Route
            path="/admin/grammar/:id"
            element={<GrammarAdminDetailPage />}
          />
          <Route path="/admin/grammar/:id/edit" element={<GrammarEditPage />} />
          <Route path="/kanji" element={<KanjiListPage />} />
          <Route path="/kanji/new" element={<KanjiCreatePage />} />
          <Route path="/kanji/:id/edit" element={<KanjiEditPage />} />
          <Route path="/kanji/:id" element={<KanjiDetailPage />} />
          <Route path="/reading" element={<ReadingListPage />} />
          <Route
            path="/reading/results/:resultId"
            element={<ReadingResultPage />}
          />
          <Route path="/reading/:id/questions" element={<ReadingQuizPage />} />
          <Route path="/reading/:id" element={<ReadingDetailPage />} />
          <Route path="/reading/new" element={<ReadingCreatePage />} />
          <Route path="/reading/:id/edit" element={<ReadingEditPage />} />
          <Route element={<FlashcardAuthGuard />}>
            <Route path="/flashcards" element={<FlashcardDeckListPage />} />
            <Route path="/flashcards/:deckId" element={<FlashcardDeckPage />} />
          </Route>
          <Route element={<WordAuthGuard />}>
            <Route path="/words" element={<WordLookupPage />} />
            <Route path="/words/:id" element={<WordDetailPage />} />
            <Route path="/words/:id/edit" element={<WordEditPage />} />
          </Route>
          <Route path="/grammar" element={<GrammarListPage />} />
          <Route path="/grammar/:id" element={<GrammarDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
