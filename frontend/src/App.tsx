import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import MainLayout from "./components/layout/MainLayout";
import AuthLayout from "./components/layout/AuthLayout";
import CourseLayout from "./components/layout/CourseLayout";

// Auth Pages
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";

// Main Pages
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Calendar from "./pages/Calendar";
import Inbox from "./pages/Inbox";
import Account from "./pages/Account";
import Labs from "./pages/Labs";

// Course Pages
import CourseHome from "./pages/course/CourseHome";
import CourseModules from "./pages/course/CourseModules";
import CourseModulesNew from "./pages/course/CourseModulesNew";
import CourseAssignments from "./pages/course/CourseAssignments";
import CreateAssignment from "./pages/course/CreateAssignment";
import AssignmentDetail from "./pages/course/AssignmentDetail";
import AssignmentDetailNew from "./pages/course/AssignmentDetailNew";
import QuizList from "./pages/course/QuizList";
import QuizListNew from "./pages/course/QuizListNew";
import QuizDetails from "./pages/course/QuizDetails";
import QuizDetailsNew from "./pages/course/QuizDetailsNew";
import QuizEditor from "./pages/course/QuizEditor";
import QuizEditorNew from "./pages/course/QuizEditorNew";
import QuizPreview from "./pages/course/QuizPreview";
import QuizAttempt from "./pages/course/QuizAttempt";
import CourseGrades from "./pages/course/CourseGrades";
import CourseGradebook from "./pages/course/CourseGradebook";
import CourseDiscussions from "./pages/course/CourseDiscussions";
import DiscussionDetail from "./pages/course/DiscussionDetail";
import CoursePeople from "./pages/course/CoursePeople";
import CourseZoom from "./pages/course/CourseZoom";

import NotFound from "./pages/NotFound";
import { QuizProvider } from "./contexts/QuizContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <QuizProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
            </Route>

            {/* Main App Routes - Protected */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/signin" replace />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/courses" 
                element={
                  <ProtectedRoute>
                    <Courses />
                  </ProtectedRoute>
                } 
              />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/account" element={<Account />} />
              <Route path="/labs" element={<Labs />} />
              <Route path="/settings" element={<Account />} />

              {/* Course Routes - Protected */}
              <Route 
                path="/courses/:courseId" 
                element={
                  <ProtectedRoute>
                    <CourseLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<CourseHome />} />
                <Route path="modules" element={<CourseModulesNew />} />
                <Route path="assignments" element={<CourseAssignments />} />
                <Route path="assignments/new" element={<CreateAssignment />} />
                <Route path="assignments/:assignmentId" element={<AssignmentDetailNew />} />
                <Route path="assignments/:assignmentId/edit" element={<CreateAssignment />} />
                <Route path="quizzes" element={<QuizListNew />} />
                <Route path="quizzes/new" element={<QuizEditorNew />} />
                <Route path="quizzes/:quizId" element={<QuizDetailsNew />} />
                <Route path="quizzes/:quizId/attempt" element={<QuizAttempt />} />
                <Route path="quizzes/:quizId/edit" element={<QuizEditorNew />} />
                <Route path="quizzes/:quizId/preview" element={<QuizPreview />} />
                <Route path="grades" element={<CourseGrades />} />
                <Route path="gradebook" element={<CourseGradebook />} />
                <Route path="discussions" element={<CourseDiscussions />} />
                <Route path="discussions/:discussionId" element={<DiscussionDetail />} />
                <Route path="people" element={<CoursePeople />} />
                <Route path="zoom" element={<CourseZoom />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QuizProvider>
  </QueryClientProvider>
);

export default App;
