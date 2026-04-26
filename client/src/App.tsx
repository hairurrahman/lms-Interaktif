import { Switch, Route, Router } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { BottomDock } from '@/components/BottomDock';
import { LoginPage } from '@/pages/Login';
import { StudentDashboard } from '@/pages/StudentDashboard';
import { TeacherDashboard } from '@/pages/TeacherDashboard';
import { SubjectsListPage } from '@/pages/SubjectsList';
import { SubjectDetailPage } from '@/pages/SubjectDetail';
import { MaterialDetailPage } from '@/pages/MaterialDetail';
import { QuizGamePage } from '@/pages/QuizGame';
import { ForumPage, ForumPostPage } from '@/pages/Forum';
import { LeaderboardPage } from '@/pages/Leaderboard';
import { TeacherMaterialsPage } from '@/pages/TeacherMaterials';
import { TeacherQuizzesPage } from '@/pages/TeacherQuizzes';
import { TeacherStudentsPage } from '@/pages/TeacherStudents';
import { TeacherSubjectsPage } from '@/pages/TeacherSubjects';


function DashboardRouter() {
  const { user } = useAuth();
  return user?.role === 'guru' ? <TeacherDashboard /> : <StudentDashboard />;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={DashboardRouter} />
      <Route path="/mapel" component={SubjectsListPage} />
      <Route path="/mapel/:id" component={SubjectDetailPage} />
      <Route path="/materi/:id" component={MaterialDetailPage} />
      <Route path="/kuis/:id" component={QuizGamePage} />
      <Route path="/forum" component={ForumPage} />
      <Route path="/forum/:id" component={ForumPostPage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/guru/materi" component={TeacherMaterialsPage} />
      <Route path="/guru/kuis" component={TeacherQuizzesPage} />
      <Route path="/guru/siswa" component={TeacherStudentsPage} />
      <Route path="/guru/mapel" component={TeacherSubjectsPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function Shell() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pop">🎓</div>
      </div>
    );
  }
  if (!user) return <LoginPage />;
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pb-24"> {/* Extra padding for the floating dock */}
        <AppRouter />
      </main>
      <BottomDock />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router hook={useHashLocation}>
            <Shell />
          </Router>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
