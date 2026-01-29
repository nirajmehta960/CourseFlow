import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Plus,
  Calendar,
  MoreHorizontal,
  FileText,
  Clock,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getNotifications, Notification } from "@/lib/notifications-api";
import { getMyCourses, Course } from "@/lib/courses-api";
import { getCalendarEvents, CalendarEvent } from "@/lib/calendar-api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import {
  format,
  parseISO,
  isToday,
  isYesterday,
  isTomorrow,
  formatDistanceToNow,
  isFuture,
} from "date-fns";
import NotificationBell from "@/components/NotificationBell";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState";
import { Bell } from "lucide-react";

type DashboardItem =
  | { kind: 'notification'; data: Notification; date: Date }
  | { kind: 'event'; data: CalendarEvent; date: Date };

interface DayGroup {
  dateLabel: string;
  dateObj: Date; // Keep for sorting
  items: DashboardItem[];
}

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

// Group items by date
const groupItemsByDate = (items: DashboardItem[]): DayGroup[] => {
  const groups: Map<string, DayGroup> = new Map();

  items.forEach((item) => {
    const date = item.date;
    let dateLabel: string;

    if (isToday(date)) {
      dateLabel = "Today";
    } else if (isTomorrow(date)) {
      dateLabel = "Tomorrow";
    } else if (isYesterday(date)) {
      dateLabel = "Yesterday";
    } else {
      dateLabel = format(date, "EEEE, MMMM d");
    }

    if (!groups.has(dateLabel)) {
      groups.set(dateLabel, { dateLabel, dateObj: date, items: [] });
    }
    groups.get(dateLabel)!.items.push(item);
  });

  // Convert to array and sort
  return Array.from(groups.values())
    .sort((a, b) => {
      // Custom sort: Tomorrow > Today > Yesterday > Dates (descending)
      const getPriority = (label: string) => {
        if (label === "Tomorrow") return 4;
        if (label === "Today") return 3;
        if (label === "Yesterday") return 2;
        return 1;
      };

      const pA = getPriority(a.dateLabel);
      const pB = getPriority(b.dateLabel);

      if (pA !== pB) return pB - pA; // Higher priority first

      // If same priority (e.g. both dates), sort descending (Future -> Past)
      return b.dateObj.getTime() - a.dateObj.getTime();
    });
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [courses, setCourses] = useState<Map<string, Course>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch courses, notifications, and calendar events
      const [coursesList, notificationsData, calendarData] = await Promise.all([
        getMyCourses(),
        getNotifications(),
        getCalendarEvents(), // Defaults to -30d to +60d
      ]);

      // Map courses
      const coursesMap = new Map<string, Course>();
      coursesList.forEach((course) => {
        coursesMap.set(course.id, course);
      });
      setCourses(coursesMap);

      // Merge and standardize items
      const combinedItems: DashboardItem[] = [];

      // Add Notifications (filtered to exclude messages and grades)
      notificationsData.forEach(n => {
        if (n.type !== 'INBOX_MESSAGE' && n.type !== 'GRADE_POSTED') {
          combinedItems.push({
            kind: 'notification',
            data: n,
            date: parseISO(n.createdAt || new Date().toISOString())
          });
        }
      });

      // Add Calendar Events
      calendarData.forEach(e => {
        combinedItems.push({
          kind: 'event',
          data: e,
          date: parseISO(e.startAt)
        });
      });

      // Sort individual items within groups by date descending
      combinedItems.sort((a, b) => b.date.getTime() - a.date.getTime());

      setItems(combinedItems);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: DashboardItem) => {
    if (item.kind === 'notification' && item.data.link) {
      navigate(item.data.link);
    } else if (item.kind === 'event') {
      // Construct link based on event type
      const event = item.data;
      if (event.type === 'ASSIGNMENT_DUE') {
        navigate(`/courses/${event.courseId}/assignments/${event.refId}`);
      } else if (event.type === 'QUIZ_DUE') {
        navigate(`/courses/${event.courseId}/quizzes/${event.refId}`);
      } else {
        navigate(`/calendar`);
      }
    }
  };

  const getSubTitle = (item: DashboardItem) => {
    if (item.kind === 'notification') {
      return item.data.type?.replace(/_/g, ' ') || 'Notification';
    } else {
      return item.data.type?.replace(/_/g, ' ') || 'Event';
    }
  };

  const getIcon = (item: DashboardItem) => {
    if (item.kind === 'notification') {
      switch (item.data.type) {
        case 'NEW_ASSIGNMENT': return <FileText className="h-5 w-5 text-primary" />;
        case 'NEW_QUIZ': return <HelpCircle className="h-5 w-5 text-primary" />;
        case 'GRADE_POSTED': return <CheckCircle2 className="h-5 w-5 text-primary" />;
        case 'DISCUSSION_REPLY': return <MessageSquare className="h-5 w-5 text-primary" />;
        case 'INBOX_MESSAGE': return <Mail className="h-5 w-5 text-primary" />;
        default: return <Bell className="h-5 w-5 text-primary" />;
      }
    } else {
      switch (item.data.type) {
        case 'ASSIGNMENT_DUE': return <FileText className="h-5 w-5 text-primary" />;
        case 'QUIZ_DUE': return <CheckCircle2 className="h-5 w-5 text-warning" />;
        default: return <Calendar className="h-5 w-5 text-muted-foreground" />;
      }
    }
  };

  const activityByDate = groupItemsByDate(items);

  return (
    <div className="w-full min-h-full bg-background overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Dashboard</h1>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Calendar className="h-4 w-4" />
            </Button>
            <div className="hidden md:block">
              {/* <NotificationBell /> removed */}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* New Activity Button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 flex justify-end">
        <Button variant="outline" size="sm" className="gap-2">
          NEW ACTIVITY
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

      {/* Activity Feed */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pb-12">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : activityByDate.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-12 w-12" />}
            title="No recent activity"
            description="You don't have any notifications or activity yet. Check back later for updates."
          />
        ) : (
          <div className="space-y-0">
            {activityByDate.map((dayGroup) => (
              <div key={dayGroup.dateLabel}>
                {/* Date Header */}
                <div className="py-4">
                  <h2 className="text-sm font-medium text-foreground">
                    {dayGroup.dateLabel}
                  </h2>
                </div>

                {/* Items */}
                <div className="space-y-0">
                  {dayGroup.items.map((item) => {
                    const isNotif = item.kind === 'notification';
                    const data = item.data;
                    const courseId = isNotif
                      ? (data as Notification).courseId || (data as Notification).link?.match(/\/courses\/([^/]+)/)?.[1] || ""
                      : (data as CalendarEvent).courseId;

                    const course = courses.get(courseId);
                    const courseCode = course?.code || "Unknown";
                    const courseName = course?.title || "Course";
                    const courseColor = course ? getCourseColor(course.id) : "#6B7280";
                    const itemId = isNotif ? (data as Notification).id : (data as CalendarEvent).id;
                    const isRead = isNotif ? (data as Notification).isRead : true; // Events are always "read"

                    return (
                      <button
                        key={itemId}
                        onClick={() => handleItemClick(item)}
                        className={cn(
                          "w-full flex flex-col sm:flex-row items-start gap-3 sm:gap-4 py-4 border-t border-border group hover:bg-muted/30 transition-colors text-left",
                          !isRead && "bg-primary/5"
                        )}
                      >
                        {/* Course Color Badge */}
                        <div className="flex items-start gap-2 shrink-0">
                          <div
                            className="w-2 h-2 rounded-full mt-2 shrink-0"
                            style={{ backgroundColor: courseColor }}
                          />
                          <div
                            className="w-24 sm:w-28 h-14 sm:h-16 rounded text-[10px] font-semibold text-white flex items-center justify-center text-center px-1 leading-tight shrink-0"
                            style={{ backgroundColor: courseColor }}
                          >
                            <span className="line-clamp-2">
                              {courseCode}
                              <br />
                              {(courseName || "Course").split(" ").slice(0, 3).join(" ").toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <div className="flex items-start gap-3">
                            <span className="shrink-0 mt-0.5 flex items-center justify-center">
                              {getIcon(item)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-xs text-muted-foreground uppercase">
                                  {courseCode} • {getSubTitle(item)}
                                </p>
                                {!isRead && (
                                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                )}
                              </div>
                              <p className="text-sm font-medium text-foreground">
                                {data.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {isNotif
                                  ? (data as Notification).body
                                  : (() => {
                                    try {
                                      return `Due ${format(item.date, "h:mm a")}`;
                                    } catch (e) {
                                      return "Due soon";
                                    }
                                  })()
                                }
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {(() => {
                                  try {
                                    return isFuture(item.date)
                                      ? <span className="text-primary font-medium flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Due {formatDistanceToNow(item.date, { addSuffix: true })}
                                      </span>
                                      : formatDistanceToNow(item.date, { addSuffix: true });
                                  } catch (e) {
                                    return "Recently";
                                  }
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
