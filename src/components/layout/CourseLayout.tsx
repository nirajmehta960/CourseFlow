import { Outlet, useParams, Link } from "react-router-dom";
import CourseNavbar from "./CourseNavbar";
import { Menu, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// Mock course data - would come from API
const mockCourses: Record<string, { name: string; code: string }> = {
  "RS101": { name: "Rocket Propulsion", code: "RS101" },
  "CS201": { name: "Web Application Development", code: "CS201" },
  "CH301": { name: "Inorganic Chemistry", code: "CH301" },
  "PH401": { name: "Physical Chemistry", code: "PH401" },
};

const CourseLayout = () => {
  const { courseId } = useParams();
  const [showNav, setShowNav] = useState(true);
  const course = mockCourses[courseId || ""] || { name: "Course", code: courseId };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Course Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowNav(!showNav)}
          className="shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 text-lg font-display">
          <Link to="/courses" className="text-muted-foreground hover:text-foreground transition-colors">
            Courses
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-primary font-semibold">{course.name}</span>
        </div>
      </header>

      {/* Content area with course nav */}
      <div className="flex flex-1">
        {showNav && <CourseNavbar />}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default CourseLayout;
