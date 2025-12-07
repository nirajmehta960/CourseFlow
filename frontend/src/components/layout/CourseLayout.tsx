import { Outlet, useParams, Link } from "react-router-dom";
import CourseNavbar from "./CourseNavbar";
import { Menu, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getCourseById, Course } from "@/lib/courses-api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
    <div className="flex min-h-screen flex-col bg-background w-full overflow-hidden">
      {/* Course Header - responsive padding, z-index above sidebar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 sm:gap-4 border-b border-border bg-card px-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowNav(!showNav)}
          className="shrink-0 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-1 sm:gap-2 text-base sm:text-lg font-display min-w-0 flex-1">
          <Link to="/courses" className="text-muted-foreground hover:text-foreground transition-colors text-sm sm:text-base truncate">
            Courses
          </Link>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
          <span className="text-primary font-semibold truncate text-sm sm:text-base">
            {loading ? "Loading..." : courseName}
          </span>
        </div>
      </header>

      {/* Content area with course nav - responsive layout */}
      <div className="flex flex-1 overflow-hidden relative min-h-0">
        {/* Desktop Course navbar - always visible on md+, fixed width */}
        <aside className={cn(
          "hidden md:block shrink-0",
          !showNav && "md:hidden"
        )}>
          <CourseNavbar />
        </aside>
        
        {/* Mobile nav drawer - slides in from left, only on mobile */}
        {showNav && (
          <>
            <div 
              className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowNav(false)}
            />
            <aside 
              className="md:hidden fixed left-0 top-16 bottom-0 w-64 max-w-[80vw] bg-card border-r border-border overflow-y-auto shadow-xl z-50 transition-transform"
              onClick={(e) => e.stopPropagation()}
            >
              <CourseNavbar />
            </aside>
          </>
        )}
        
        {/* Main content - responsive padding and margins, prevents overflow */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full min-w-0 bg-background">
          <div className="w-full max-w-full min-w-0 px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 md:py-10 pb-20 md:pb-6 lg:pb-10 bg-background min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CourseLayout;
