import { Outlet } from "react-router-dom";
import Logo from "./Logo";

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12">
        <Logo />
        <div className="space-y-6">
          <h1 className="font-display text-4xl font-bold text-sidebar-foreground">
            Welcome to <span className="text-sidebar-primary">CourseFlow</span>
          </h1>
          <p className="text-lg text-sidebar-muted max-w-md">
            Your modern learning management system. Access courses, assignments, 
            and collaborate with peers and instructors seamlessly.
          </p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sidebar-muted">
              <div className="h-2 w-2 rounded-full bg-sidebar-primary" />
              <span>Interactive Courses</span>
            </div>
            <div className="flex items-center gap-2 text-sidebar-muted">
              <div className="h-2 w-2 rounded-full bg-sidebar-primary" />
              <span>Real-time Grades</span>
            </div>
            <div className="flex items-center gap-2 text-sidebar-muted">
              <div className="h-2 w-2 rounded-full bg-sidebar-primary" />
              <span>Collaboration Tools</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-sidebar-muted">
          © 2024 CourseFlow. Empowering education.
        </p>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
