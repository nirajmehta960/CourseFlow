import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  List,
  LayoutGrid,
  Filter,
} from "lucide-react";
import { getCalendarEvents, CalendarEvent as ApiCalendarEvent } from "@/lib/calendar-api";
import { getMyCourses, Course } from "@/lib/courses-api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { format, parseISO, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState";
import { Calendar as CalendarIcon } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  courseId: string;
  courseCode?: string;
  courseColor: string;
  type: "ASSIGNMENT_DUE" | "QUIZ_DUE" | "CUSTOM";
  date: Date;
  time: string;
  endTime?: string;
  refId?: string | null;
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Generate a color based on course ID
const getCourseColor = (courseId: string): string => {
  const colors = [
    "#3B82F6", // blue
    "#DC2626", // red
    "#10B981", // green
    "#F59E0B", // amber
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#06B6D4", // cyan
    "#F97316", // orange
  ];
  let hash = 0;
  for (let i = 0; i < courseId.length; i++) {
    hash = courseId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const Calendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [view, setView] = useState<"month" | "agenda">("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [courses, setCourses] = useState<Map<string, Course>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get courses for course codes
      const coursesList = await getMyCourses();
      const coursesMap = new Map<string, Course>();
      coursesList.forEach((course) => {
        coursesMap.set(course.id, course);
      });
      setCourses(coursesMap);
      
      // Calculate date range for current month view
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      // Fetch events for the month
      const apiEvents = await getCalendarEvents(
        monthStart.toISOString(),
        monthEnd.toISOString()
      );
      
      // Transform API events to calendar events
      const transformedEvents: CalendarEvent[] = apiEvents.map((event) => {
        const eventDate = parseISO(event.startAt);
        const course = coursesMap.get(event.courseId);
        
        return {
          id: event.id,
          title: event.title,
          courseId: event.courseId,
          courseCode: course?.code || "Unknown",
          courseColor: getCourseColor(event.courseId),
          type: event.type,
          date: eventDate,
          time: format(eventDate, "h:mm a"),
          endTime: event.endAt ? format(parseISO(event.endAt), "h:mm a") : undefined,
          refId: event.refId,
        };
      });
      
      setEvents(transformedEvents);
    } catch (error) {
      console.error("Failed to fetch calendar data:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
    );
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (!event.refId) return;
    
    const course = courses.get(event.courseId);
    if (!course) return;
    
    if (event.type === "ASSIGNMENT_DUE") {
      navigate(`/courses/${event.courseId}/assignments/${event.refId}`);
    } else if (event.type === "QUIZ_DUE") {
      navigate(`/courses/${event.courseId}/quizzes/${event.refId}`);
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return selectedDate?.getTime() === date.getTime();
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Get all events for the month for agenda view
  const monthEvents = events
    .filter((e) => e.date.getMonth() === month && e.date.getFullYear() === year)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="w-full min-h-full bg-background overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Calendar</h1>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-base sm:text-lg font-medium text-foreground">
              {months[month]} {year}
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button
                variant={view === "month" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-none h-8"
                onClick={() => setView("month")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "agenda" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-none h-8"
                onClick={() => setView("agenda")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Calendars
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
          <div className="bg-card border border-border rounded-lg">
            <div className="grid grid-cols-7 border-b border-border bg-muted/30">
              {daysOfWeek.map((day) => (
                <div key={day} className="py-3 text-center">
                  <Skeleton className="h-4 w-12 mx-auto" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-28 border-b border-r border-border" />
              ))}
            </div>
          </div>
        </div>
      ) : view === "month" ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 w-full">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Calendar Grid */}
            <div className="flex-1 min-w-0 w-full">
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                {/* Days of week header */}
                <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                  {daysOfWeek.map((day) => (
                    <div
                      key={day}
                      className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                  {/* Empty cells for days before the first day of the month */}
                  {Array.from({ length: firstDayWeekday }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-28 border-b border-r border-border bg-muted/20" />
                  ))}

                  {/* Days of the month */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const date = new Date(year, month, day);
                    const dayEvents = getEventsForDate(date);
                    const dayOfWeek = date.getDay();
                    const isLastRow = Math.ceil((firstDayWeekday + daysInMonth) / 7) === Math.ceil((firstDayWeekday + day) / 7);

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          "h-20 sm:h-24 md:h-28 p-1 sm:p-2 text-left transition-colors hover:bg-muted/30 border-r border-b border-border",
                          dayOfWeek === 6 && "border-r-0",
                          isLastRow && "border-b-0",
                          isSelected(date) && "bg-primary/5 ring-1 ring-inset ring-primary"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm font-medium",
                            isToday(date) && "bg-primary text-primary-foreground",
                            !isToday(date) && "text-foreground"
                          )}
                        >
                          {day}
                        </span>
                        <div className="mt-0.5 sm:mt-1 space-y-0.5 overflow-hidden">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className="flex items-center gap-1 text-[10px] sm:text-xs truncate"
                            >
                              <div
                                className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: event.courseColor }}
                              />
                              <span className="truncate text-foreground">{event.title}</span>
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              +{dayEvents.length - 2} more
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar - Selected date events */}
            <aside className="hidden lg:block w-full lg:w-80 xl:w-96 shrink-0 min-w-0">
              <div className="bg-card border border-border rounded-lg">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">
                    {selectedDate
                      ? selectedDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })
                      : "Select a date"}
                  </h3>
                </div>
                <div className="p-4">
                  {selectedDateEvents.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className={cn(
                            "flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors",
                            event.refId && "cursor-pointer"
                          )}
                        >
                          <div
                            className="w-1 rounded-full shrink-0"
                            style={{ backgroundColor: event.courseColor }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm">
                              {event.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {event.courseCode} · {event.time}
                              {event.endTime && ` - ${event.endTime}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<CalendarIcon className="h-8 w-8" />}
                      title="No events scheduled"
                      description="There are no events scheduled for this date."
                    />
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      ) : (
        /* Agenda View */
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 w-full">
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {monthEvents.length > 0 ? (
              monthEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className={cn(
                    "flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors",
                    event.refId && "cursor-pointer"
                  )}
                >
                  <div className="w-16 text-center shrink-0">
                    <p className="text-2xl font-bold text-foreground">
                      {event.date.getDate()}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase">
                      {event.date.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                  </div>
                  <div
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: event.courseColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{event.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {event.courseCode} · {event.time}
                      {event.endTime && ` - ${event.endTime}`}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<CalendarIcon className="h-12 w-12" />}
                title="No events this month"
                description="You don't have any calendar events scheduled for this month."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
