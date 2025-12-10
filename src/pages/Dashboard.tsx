import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  MessageSquare,
  Video,
  Bell,
  Plus,
  Calendar,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Activity items grouped by date
interface ActivityItem {
  id: string;
  type: "assignment" | "announcement" | "meeting" | "quiz" | "graded";
  title: string;
  courseName: string;
  courseCode: string;
  courseColor: string;
  time?: string;
  dueTime?: string;
  completed?: boolean;
  replies?: number;
  grade?: string;
}

interface DayGroup {
  date: string;
  items: ActivityItem[];
}

const activityByDate: DayGroup[] = [
  {
    date: "Friday, 20 December",
    items: [
      {
        id: "1",
        type: "graded",
        title: "Show 1 completed item",
        courseName: "Data Management for Analytics",
        courseCode: "IE6700",
        courseColor: "#DC2626",
        completed: true,
        grade: "Graded",
      },
    ],
  },
  {
    date: "Saturday, 21 December",
    items: [
      {
        id: "2",
        type: "graded",
        title: "Show 1 completed item",
        courseName: "Data Management for Analytics",
        courseCode: "IE6700",
        courseColor: "#DC2626",
        completed: true,
        grade: "Graded",
      },
    ],
  },
  {
    date: "Monday, 23 December",
    items: [
      {
        id: "3",
        type: "announcement",
        title: "Reminder: SQL Workshop this evening",
        courseName: "Data Management for Analytics",
        courseCode: "IE6700",
        courseColor: "#DC2626",
        time: "14:10",
        replies: 0,
      },
      {
        id: "4",
        type: "quiz",
        title: "Quiz #4 on Thursday",
        courseName: "Data Management for Analytics",
        courseCode: "IE6700",
        courseColor: "#DC2626",
        time: "21:17",
        replies: 0,
      },
    ],
  },
  {
    date: "Wednesday, 25 December",
    items: [
      {
        id: "5",
        type: "meeting",
        title: "Lecture Wed 05 & 07",
        courseName: "Web Development",
        courseCode: "CS5610",
        courseColor: "#3B82F6",
        dueTime: "17:00 to 20:00",
      },
      {
        id: "6",
        type: "graded",
        title: "Show 2 completed items",
        courseName: "Web Development",
        courseCode: "CS5610",
        courseColor: "#3B82F6",
        completed: true,
        grade: "Graded • Feedback",
      },
      {
        id: "7",
        type: "announcement",
        title: "My Spring 26 courses",
        courseName: "Data Management for Analytics",
        courseCode: "IE6700",
        courseColor: "#DC2626",
        time: "14:29",
        replies: 0,
      },
    ],
  },
  {
    date: "Thursday, 26 December",
    items: [
      {
        id: "8",
        type: "graded",
        title: "Show 1 completed item",
        courseName: "Data Management for Analytics",
        courseCode: "IE6700",
        courseColor: "#DC2626",
        completed: true,
        grade: "Graded",
      },
    ],
  },
  {
    date: "Friday, 27 December",
    items: [
      {
        id: "9",
        type: "meeting",
        title: "Jose Office Hours",
        courseName: "Web Development",
        courseCode: "CS5610",
        courseColor: "#3B82F6",
        dueTime: "13:00 to 15:00",
      },
      {
        id: "10",
        type: "meeting",
        title: "Jose OH SU1 2025",
        courseName: "Web Development",
        courseCode: "CS5610",
        courseColor: "#3B82F6",
        dueTime: "14:00 to 15:00",
      },
    ],
  },
];

const Dashboard = () => {
  const [expandedCompleted, setExpandedCompleted] = useState<string[]>([]);

  const toggleCompleted = (id: string) => {
    setExpandedCompleted((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "announcement":
        return MessageSquare;
      case "meeting":
        return Video;
      case "quiz":
        return FileText;
      default:
        return FileText;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Calendar className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                2
              </span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* New Activity Button */}
      <div className="max-w-6xl mx-auto px-8 py-4 flex justify-end">
        <Button variant="outline" size="sm" className="gap-2">
          NEW ACTIVITY
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

      {/* Activity Feed */}
      <div className="max-w-6xl mx-auto px-8 pb-12">
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
                {dayGroup.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 py-4 border-t border-border group"
                  >
                    {/* Course Color Badge */}
                    <div className="flex items-start gap-2 shrink-0">
                      <div
                        className="w-2 h-2 rounded-full mt-2"
                        style={{ backgroundColor: item.courseColor }}
                      />
                      <div
                        className="w-28 h-16 rounded text-[10px] font-semibold text-white flex items-center justify-center text-center px-1 leading-tight shrink-0"
                        style={{ backgroundColor: item.courseColor }}
                      >
                        <span>
                          {item.courseCode}
                          <br />
                          {item.courseName.split(" ").slice(0, 3).join(" ").toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {item.completed ? (
                        <button
                          onClick={() => toggleCompleted(item.id)}
                          className="flex items-center gap-2 text-primary hover:underline text-sm"
                        >
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 transition-transform",
                              expandedCompleted.includes(item.id) && "rotate-90"
                            )}
                          />
                          {item.title}
                        </button>
                      ) : (
                        <div className="flex items-start gap-3">
                          {item.type !== "meeting" && (
                            <Checkbox className="mt-1" />
                          )}
                          {item.type === "meeting" && (
                            <Video className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                          )}
                          {item.type === "announcement" && (
                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-0.5">
                              {item.courseCode} {item.courseName.toUpperCase()} {item.type === "announcement" ? "ANNOUNCEMENT" : item.type === "meeting" ? "CALENDAR EVENT" : ""}
                            </p>
                            <p
                              className={cn(
                                "text-sm font-medium",
                                item.type === "announcement" || item.type === "quiz"
                                  ? "text-destructive"
                                  : "text-primary"
                              )}
                            >
                              {item.title}
                            </p>
                            {item.type === "meeting" && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Zoom Online Meeting
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-3 shrink-0">
                      {item.replies !== undefined && (
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          Replies
                        </Button>
                      )}
                      {item.dueTime && (
                        <>
                          <span className="text-xs text-muted-foreground">
                            {item.dueTime}
                          </span>
                          <Button size="sm" className="h-7 text-xs gap-1">
                            <Video className="h-3 w-3" />
                            Join
                          </Button>
                        </>
                      )}
                      {item.time && (
                        <span className="text-xs text-muted-foreground">
                          {item.time}
                        </span>
                      )}
                      {item.grade && (
                        <div className="flex gap-1">
                          {item.grade.split(" • ").map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 text-xs border border-border rounded text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
