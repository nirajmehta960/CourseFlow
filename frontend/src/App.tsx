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
import CourseAssignments from "./pages/course/CourseAssignments";
import CreateAssignment from "./pages/course/CreateAssignment";
import AssignmentDetail from "./pages/course/AssignmentDetail";
import QuizList from "./pages/course/QuizList";
import QuizDetails from "./pages/course/QuizDetails";
import QuizEditor from "./pages/course/QuizEditor";
import QuizPreview from "./pages/course/QuizPreview";
import CourseGrades from "./pages/course/CourseGrades";
import CoursePeople from "./pages/course/CoursePeople";
import CourseZoom from "./pages/course/CourseZoom";
import CourseDiscussions from "./pages/course/CourseDiscussions";

import NotFound from "./pages/NotFound";
import { QuizProvider } from "./contexts/QuizContext";
import { AuthProvider } from "./contexts/AuthContext";

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

            {/* Main App Routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/signin" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/account" element={<Account />} />
              <Route path="/labs" element={<Labs />} />
              <Route path="/settings" element={<Account />} />

              {/* Course Routes */}
              <Route path="/courses/:courseId" element={<CourseLayout />}>
                <Route index element={<CourseHome />} />
                <Route path="modules" element={<CourseModules />} />
                <Route path="assignments" element={<CourseAssignments />} />
                <Route path="assignments/new" element={<CreateAssignment />} />
                <Route path="assignments/:assignmentId" element={<AssignmentDetail />} />
                <Route path="assignments/:assignmentId/edit" element={<CreateAssignment />} />
                <Route path="quizzes" element={<QuizList />} />
                <Route path="quizzes/:quizId" element={<QuizDetails />} />
                <Route path="quizzes/:quizId/edit" element={<QuizEditor />} />
                <Route path="quizzes/:quizId/preview" element={<QuizPreview />} />
                <Route path="grades" element={<CourseGrades />} />
                <Route path="people" element={<CoursePeople />} />
                <Route path="zoom" element={<CourseZoom />} />
                <Route path="discussions" element={<CourseDiscussions />} />
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
