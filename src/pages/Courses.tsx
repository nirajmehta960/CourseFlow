import { useState } from "react";
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

const allCourses = [
  {
    id: "RS101",
    name: "Rocket Propulsion",
    code: "RS101",
    instructor: "Dr. Sarah Chen",
    department: "Aerospace Engineering",
    enrolled: true,
    term: "Fall 2024",
    color: "#3B82F6",
    favorite: true,
    students: 45,
    image: "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=400&h=200&fit=crop",
  },
  {
    id: "CS201",
    name: "Web Application Development",
    code: "CS201",
    instructor: "Prof. Michael Torres",
    department: "Computer Science",
    enrolled: true,
    term: "Fall 2024",
    color: "#10B981",
    favorite: false,
    students: 62,
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop",
  },
  {
    id: "CH301",
    name: "Inorganic Chemistry",
    code: "CH301",
    instructor: "Dr. Emily Watson",
    department: "Chemistry",
    enrolled: true,
    term: "Fall 2024",
    color: "#8B5CF6",
    favorite: false,
    students: 38,
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=200&fit=crop",
  },
  {
    id: "PH401",
    name: "Physical Chemistry",
    code: "PH401",
    instructor: "Prof. James Miller",
    department: "Chemistry",
    enrolled: true,
    term: "Fall 2024",
    color: "#F59E0B",
    favorite: true,
    students: 29,
    image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&h=200&fit=crop",
  },
  {
    id: "MA201",
    name: "Linear Algebra",
    code: "MA201",
    instructor: "Dr. Robert Kim",
    department: "Mathematics",
    enrolled: false,
    term: "Spring 2025",
    color: "#6366F1",
    favorite: false,
    students: 55,
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=200&fit=crop",
  },
  {
    id: "PH201",
    name: "Quantum Mechanics",
    code: "PH201",
    instructor: "Prof. Lisa Anderson",
    department: "Physics",
    enrolled: false,
    term: "Spring 2025",
    color: "#EC4899",
    favorite: false,
    students: 41,
    image: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=200&fit=crop",
  },
  {
    id: "EE301",
    name: "Digital Signal Processing",
    code: "EE301",
    instructor: "Dr. Alex Turner",
    department: "Electrical Engineering",
    enrolled: false,
    term: "Spring 2025",
    color: "#EF4444",
    favorite: false,
    students: 33,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=200&fit=crop",
  },
  {
    id: "CS301",
    name: "Machine Learning",
    code: "CS301",
    instructor: "Prof. David Lee",
    department: "Computer Science",
    enrolled: false,
    term: "Spring 2025",
    color: "#14B8A6",
    favorite: false,
    students: 78,
    image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=200&fit=crop",
  },
];

const Courses = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [termFilter, setTermFilter] = useState("all");
  const [enrollmentFilter, setEnrollmentFilter] = useState("all");
  const [favorites, setFavorites] = useState<string[]>(
    allCourses.filter((c) => c.favorite).map((c) => c.id)
  );

  const terms = [...new Set(allCourses.map((c) => c.term))];

  const toggleFavorite = (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const filteredCourses = allCourses.filter((course) => {
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
    course: (typeof allCourses)[0];
    isEnrolled: boolean;
  }) => {
    const isFavorite = favorites.includes(course.id);

    return (
      <div className="group h-full">
        <div
          className={cn(
            "bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 h-full flex flex-col",
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
              <div className="flex items-center gap-1.5 text-white/90 text-xs">
                <Users className="h-3.5 w-3.5" />
                <span>{course.students}</span>
              </div>
            </div>
          </div>

          {/* Card Body - Flex grow to fill remaining space */}
          <div className="p-4 flex flex-col flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3
                className={cn(
                  "font-semibold text-foreground text-sm leading-snug line-clamp-2 min-h-[2.5rem]",
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
                    className="h-7 w-7 shrink-0 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
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

            <p className="text-xs text-muted-foreground mb-1">{course.instructor}</p>
            <p className="text-xs text-muted-foreground/70 mb-3">{course.department}</p>

            {/* Spacer to push button to bottom */}
            <div className="mt-auto">
              {!isEnrolled && (
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Request to Enroll
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">My Courses</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and explore your courses for {termFilter === "all" ? "all terms" : termFilter}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {enrolledCourses.length} Enrolled
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses, instructors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border h-11"
            />
          </div>
          <div className="flex gap-3">
            <Select value={termFilter} onValueChange={setTermFilter}>
              <SelectTrigger className="w-40 bg-card h-11">
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
              <SelectTrigger className="w-40 bg-card h-11">
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
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
                Published Courses ({enrolledCourses.length})
              </h2>
              <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {enrolledCourses.map((course, index) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="block animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CourseCard course={course} isEnrolled={true} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Available Courses */}
        {availableCourses.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
                Available Courses ({availableCourses.length})
              </h2>
              <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {availableCourses.map((course, index) => (
                <div
                  key={course.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CourseCard course={course} isEnrolled={false} />
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredCourses.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-foreground font-medium mb-1">No courses found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
