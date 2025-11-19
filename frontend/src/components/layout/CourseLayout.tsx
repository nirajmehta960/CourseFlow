import { Outlet, useParams, Link } from "react-router-dom";
import CourseNavbar from "./CourseNavbar";
import { Menu, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getCourseById, Course } from "@/lib/courses-api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const CourseLayout = () => {
  const { courseId } = useParams();
  const [showNav, setShowNav] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      
      try {
        setLoading(true);
        const data = await getCourseById(courseId);
        setCourse(data);
      } catch (error) {
        console.error("Failed to fetch course:", error);
        toast({
          title: "Error",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const courseName = course?.title || "Course";
  const courseCode = course?.code || courseId || "";

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
          <span className="text-primary font-semibold">{loading ? "Loading..." : courseName}</span>
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
