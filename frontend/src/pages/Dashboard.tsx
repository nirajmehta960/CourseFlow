import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  MessageSquare,
  Video,
  Plus,
  Calendar,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getNotifications, Notification } from "@/lib/notifications-api";
import { getMyCourses, Course } from "@/lib/courses-api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { format, parseISO, startOfDay, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import NotificationBell from "@/components/NotificationBell";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState";
import { Bell } from "lucide-react";

interface DayGroup {
  date: string;
  items: Notification[];
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

// Group notifications by date
const groupNotificationsByDate = (notifications: Notification[]): DayGroup[] => {
  const groups: Map<string, Notification[]> = new Map();
  
  notifications.forEach((notification) => {
    const date = parseISO(notification.createdAt);
    let dateLabel: string;
    
    if (isToday(date)) {
      dateLabel = "Today";
    } else if (isYesterday(date)) {
      dateLabel = "Yesterday";
    } else {
      dateLabel = format(date, "EEEE, MMMM d");
    }
    
    if (!groups.has(dateLabel)) {
      groups.set(dateLabel, []);
    }
    groups.get(dateLabel)!.push(notification);
  });
  
  // Convert to array and sort by date (newest first)
  return Array.from(groups.entries())
    .map(([date, items]) => ({ date, items }))
    .sort((a, b) => {
      // Sort by date: Today > Yesterday > others (by date)
      if (a.date === "Today") return -1;
      if (b.date === "Today") return 1;
      if (a.date === "Yesterday") return -1;
      if (b.date === "Yesterday") return 1;
      return parseISO(b.items[0].createdAt).getTime() - parseISO(a.items[0].createdAt).getTime();
    });
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [courses, setCourses] = useState<Map<string, Course>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedCompleted, setExpandedCompleted] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch courses and notifications in parallel
      const [coursesList, notificationsData] = await Promise.all([
        getMyCourses(),
        getNotifications(),
      ]);
      
      // Map courses
      const coursesMap = new Map<string, Course>();
      coursesList.forEach((course) => {
        coursesMap.set(course.id, course);
      });
      setCourses(coursesMap);
      
      setNotifications(notificationsData);
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

  const toggleCompleted = (id: string) => {
    setExpandedCompleted((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'NEW_ASSIGNMENT':
        return '📝';
      case 'NEW_QUIZ':
        return '❓';
      case 'GRADE_POSTED':
        return '✅';
      case 'DISCUSSION_REPLY':
        return '💬';
      case 'INBOX_MESSAGE':
        return '📧';
      default:
        return '🔔';
    }
  };

  const activityByDate = groupNotificationsByDate(notifications);

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
              <NotificationBell />
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
              <div key={dayGroup.date}>
                {/* Date Header */}
                <div className="py-4">
                  <h2 className="text-sm font-medium text-foreground">
                    {dayGroup.date}
                  </h2>
                </div>

                {/* Items */}
                <div className="space-y-0">
                  {dayGroup.items.map((notification) => {
                    const course = courses.get(notification.link?.match(/\/courses\/([^/]+)/)?.[1] || "");
                    const courseCode = course?.code || "Unknown";
                    const courseName = course?.title || "Course";
                    const courseColor = course ? getCourseColor(course.id) : "#6B7280";
                    
                    return (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "w-full flex flex-col sm:flex-row items-start gap-3 sm:gap-4 py-4 border-t border-border group hover:bg-muted/30 transition-colors text-left",
                          !notification.isRead && "bg-primary/5"
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
                              {courseName.split(" ").slice(0, 3).join(" ").toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <div className="flex items-start gap-3">
                            <span className="text-xl shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-xs text-muted-foreground">
                                  {courseCode} • {notification.type.replace(/_/g, ' ')}
                                </p>
                                {!notification.isRead && (
                                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                )}
                              </div>
                              <p className="text-sm font-medium text-foreground">
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {notification.body}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatDistanceToNow(parseISO(notification.createdAt), { addSuffix: true })}
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
