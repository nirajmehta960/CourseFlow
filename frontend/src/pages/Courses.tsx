import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Star, MoreVertical, BookOpen, Users, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getMyCourses, getAllPublishedCourses, selfEnrollInCourse, Course, createCourse } from "@/lib/courses-api";
import { CreateCourseDialog } from "@/components/course/CreateCourseDialog";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";

// Generate a color based on course ID for consistent styling
const generateColor = (id: string): string => {
  const colors = [
    "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#6366F1",
    "#EC4899", "#EF4444", "#14B8A6", "#06B6D4", "#84CC16"
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Default course image
const defaultCourseImage = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop";

interface CourseDisplay {
  id: string;
  name: string;
  code: string;
  instructor: string;
  department: string;
  enrolled: boolean;
  term: string;
  color: string;
  favorite: boolean;
  students: number;
  image: string;
}

const Courses = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [termFilter, setTermFilter] = useState("all");
  const [enrollmentFilter, setEnrollmentFilter] = useState("all");
  const [courses, setCourses] = useState<CourseDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  const { user } = useAuth();

  const isInstructor = user?.roles.includes('INSTRUCTOR') || user?.roles.includes('ADMIN');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        // Fetch both enrolled and published courses
        const [myCourses, publishedCourses] = await Promise.all([
          getMyCourses(),
          getAllPublishedCourses()
        ]);

        const courseMap = new Map<string, CourseDisplay>();

        // Process enrolled courses first
        myCourses.forEach((course: Course) => {
          courseMap.set(course.id, {
            id: course.id,
            name: course.title,
            code: course.code,
            instructor: "Instructor", // TODO: Fetch instructor names from user IDs
            department: "", // Not available in API
            enrolled: true,
            term: course.term,
            color: generateColor(course.id),
            favorite: false, // TODO: Implement favorites feature
            students: 0, // TODO: Get from course people API if needed
            image: course.coverImageUrl || defaultCourseImage,
          });
        });

        // Add published courses if not already in the map
        publishedCourses.forEach((course: Course) => {
          if (!courseMap.has(course.id)) {
            courseMap.set(course.id, {
              id: course.id,
              name: course.title,
              code: course.code,
              instructor: "Instructor",
              department: "",
              enrolled: false,
              term: course.term,
              color: generateColor(course.id),
              favorite: false,
              students: 0,
              image: course.coverImageUrl || defaultCourseImage,
            });
          }
        });

        setCourses(Array.from(courseMap.values()));
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        toast({
          title: "Error",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleEnroll = async (courseId: string) => {
    try {
      setEnrollingCourseId(courseId);
      await selfEnrollInCourse(courseId);

      // Update the course to mark it as enrolled
      setCourses(prevCourses =>
        prevCourses.map(course =>
          course.id === courseId ? { ...course, enrolled: true } : course
        )
      );

      toast({
        title: "Success",
        description: "Successfully enrolled in course",
      });
    } catch (error) {
      console.error("Failed to enroll:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const terms = [...new Set(courses.map((c) => c.term))];

  const toggleFavorite = (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTerm = termFilter === "all" || course.term === termFilter;
    const matchesEnrollment =
      enrollmentFilter === "all" ||
      (enrollmentFilter === "enrolled" && course.enrolled) ||
      (enrollmentFilter === "available" && !course.enrolled);
    return matchesSearch && matchesTerm && matchesEnrollment;
  });

  const enrolledCourses = filteredCourses.filter((c) => c.enrolled);
  const availableCourses = filteredCourses.filter((c) => !c.enrolled);

  const CourseCard = ({
    course,
    isEnrolled,
  }: {
    course: CourseDisplay;
    isEnrolled: boolean;
  }) => {
    const isFavorite = favorites.includes(course.id);

    return (
      <div className="group h-full w-full min-w-0">
        <div
          className={cn(
            "bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 h-full flex flex-col w-full",
            isEnrolled && "hover:shadow-lg hover:border-primary/20 hover:-translate-y-1"
          )}
        >
          {/* Course Image - Fixed height */}
          <div className="relative h-36 overflow-hidden shrink-0">
            <img
              src={course.image}
              alt={course.name}
              className={cn(
                "w-full h-full object-cover",
                isEnrolled && "transition-transform duration-500 group-hover:scale-110"
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

            {/* Favorite Star */}
            <button
              onClick={(e) => toggleFavorite(course.id, e)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors"
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-colors",
                  isFavorite
                    ? "text-amber-400 fill-amber-400"
                    : "text-white/70 hover:text-white"
                )}
              />
            </button>

            {/* Course Code Badge */}
            <div className="absolute top-3 left-3">
              <span
                className="px-2.5 py-1 text-xs font-semibold rounded-full text-white"
                style={{ backgroundColor: course.color }}
              >
                {course.code}
              </span>
            </div>

            {/* Term Overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-white/90 text-xs">
                <Calendar className="h-3.5 w-3.5" />
                <span>{course.term}</span>
              </div>
              {course.students > 0 && (
                <div className="flex items-center gap-1.5 text-white/90 text-xs">
                  <Users className="h-3.5 w-3.5" />
                  <span>{course.students}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card Body - Flex grow to fill remaining space */}
          <div className="p-4 flex flex-col flex-1">
            <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
              <h3
                className={cn(
                  "font-semibold text-foreground text-sm leading-snug line-clamp-2 min-h-[2.5rem] flex-1 min-w-0",
                  isEnrolled && "group-hover:text-primary transition-colors"
                )}
              >
                {course.name}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.preventDefault()}
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => toggleFavorite(course.id, e)}>
                    <Star className="h-4 w-4 mr-2" />
                    {isFavorite ? "Remove from favorites" : "Add to favorites"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <BookOpen className="h-4 w-4 mr-2" />
                    View syllabus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {course.instructor && (
              <p className="text-xs text-muted-foreground mb-1">{course.instructor}</p>
            )}
            {course.department && (
              <p className="text-xs text-muted-foreground/70 mb-3">{course.department}</p>
            )}

            {/* Spacer to push button to bottom */}
            <div className="mt-auto">
              {!isEnrolled && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEnroll(course.id);
                  }}
                  disabled={enrollingCourseId === course.id}
                >
                  {enrollingCourseId === course.id ? "Enrolling..." : "Enroll"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-full bg-background overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">My Courses</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Manage and explore your courses for {termFilter === "all" ? "all terms" : termFilter}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isInstructor && <CreateCourseDialog onCourseCreated={() => {
                // Refresh courses list
                const fetchCourses = async () => {
                  try {
                    setLoading(true);
                    const [myCourses, publishedCourses] = await Promise.all([
                      getMyCourses(),
                      getAllPublishedCourses()
                    ]);

                    const courseMap = new Map<string, CourseDisplay>();

                    myCourses.forEach((course: Course) => {
                      courseMap.set(course.id, {
                        id: course.id,
                        name: course.title,
                        code: course.code,
                        instructor: "Instructor",
                        department: "",
                        enrolled: true,
                        term: course.term,
                        color: generateColor(course.id),
                        favorite: false,
                        students: 0,
                        image: course.coverImageUrl || defaultCourseImage,
                      });
                    });

                    publishedCourses.forEach((course: Course) => {
                      if (!courseMap.has(course.id)) {
                        courseMap.set(course.id, {
                          id: course.id,
                          name: course.title,
                          code: course.code,
                          instructor: "Instructor",
                          department: "",
                          enrolled: false,
                          term: course.term,
                          color: generateColor(course.id),
                          favorite: false,
                          students: 0,
                          image: course.coverImageUrl || defaultCourseImage,
                        });
                      }
                    });

                    setCourses(Array.from(courseMap.values()));
                  } catch (error) {
                    console.error("Failed to refresh courses:", error);
                    toast({
                      title: "Error",
                      description: getErrorMessage(error),
                      variant: "destructive",
                    });
                  } finally {
                    setLoading(false);
                  }
                };
                fetchCourses();
              }} />}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                <BookOpen className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-primary whitespace-nowrap">
                  {enrolledCourses.length} Enrolled
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0">
        {loading ? (
          <div className="w-full min-w-0">
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Skeleton className="h-11 flex-1 max-w-md" />
              <Skeleton className="h-11 w-40" />
              <Skeleton className="h-11 w-40" />
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                  <Skeleton className="h-36 w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-9 w-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full min-w-0">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 w-full">
              <div className="relative flex-1 min-w-0 max-w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0 pointer-events-none" />
                <Input
                  placeholder="Search courses, instructors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border h-11 w-full"
                />
              </div>
              <div className="flex gap-2 sm:gap-3 shrink-0">
                <Select value={termFilter} onValueChange={setTermFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-card h-11 min-w-[120px]">
                    <SelectValue placeholder="Term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Terms</SelectItem>
                    {terms.map((term) => (
                      <SelectItem key={term} value={term}>
                        {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={enrollmentFilter} onValueChange={setEnrollmentFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-card h-11 min-w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Enrolled Courses */}
            {enrolledCourses.length > 0 && (
              <div className="mb-12 w-full">
                <div className="flex items-center gap-2 sm:gap-3 mb-5 w-full">
                  <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent min-w-0" />
                  <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2 shrink-0 whitespace-nowrap">
                    My Courses ({enrolledCourses.length})
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent min-w-0" />
                </div>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full">
                  {enrolledCourses.map((course, index) => (
                    <Link
                      key={course.id}
                      to={`/courses/${course.id}`}
                      className="block w-full min-w-0 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={(e) => {
                        // Prevent navigation if clicking on enroll button
                        if ((e.target as HTMLElement).closest('button')) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <CourseCard course={course} isEnrolled={true} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Available Courses */}
            {availableCourses.length > 0 && (
              <div className="mb-12 w-full">
                <div className="flex items-center gap-2 sm:gap-3 mb-5 w-full">
                  <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent min-w-0" />
                  <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2 shrink-0 whitespace-nowrap">
                    Available Courses ({availableCourses.length})
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent min-w-0" />
                </div>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full">
                  {availableCourses.map((course, index) => (
                    <div
                      key={course.id}
                      className="block w-full min-w-0 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CourseCard course={course} isEnrolled={false} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredCourses.length === 0 && !loading && (
              <EmptyState
                icon={<BookOpen className="h-12 w-12" />}
                title={courses.length === 0 ? "No courses yet" : "No courses found"}
                description={
                  courses.length === 0
                    ? "You are not enrolled in any courses yet. Create a new course or enroll in an existing one to get started."
                    : "Try adjusting your search or filters to find courses."
                }
                action={
                  courses.length === 0
                    ? {
                      label: isInstructor ? "Create Course" : "Refresh",
                      onClick: () => {
                        if (isInstructor) {
                          // Trigger create course dialog
                          const button = document.querySelector('[data-create-course]') as HTMLButtonElement;
                          button?.click();
                        } else {
                          window.location.reload();
                        }
                      },
                    }
                    : undefined
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
