import { useState } from "react";
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

interface CalendarEvent {
  id: number;
  title: string;
  course: string;
  courseColor: string;
  type: "assignment" | "quiz" | "class" | "meeting" | "office-hours";
  date: Date;
  time: string;
  endTime?: string;
}

const events: CalendarEvent[] = [
  { id: 1, title: "Quiz 3 - JavaScript Fundamentals", course: "CS5610", courseColor: "#3B82F6", type: "quiz", date: new Date(2024, 11, 22), time: "10:00 AM" },
  { id: 2, title: "Homework #5 Due", course: "IE6700", courseColor: "#DC2626", type: "assignment", date: new Date(2024, 11, 23), time: "11:59 PM" },
  { id: 3, title: "Lecture - Advanced Topics", course: "CS5610", courseColor: "#3B82F6", type: "class", date: new Date(2024, 11, 25), time: "5:00 PM", endTime: "8:00 PM" },
  { id: 4, title: "Office Hours - Prof. Chen", course: "CS5610", courseColor: "#3B82F6", type: "office-hours", date: new Date(2024, 11, 26), time: "2:00 PM", endTime: "4:00 PM" },
  { id: 5, title: "Final Project Presentation", course: "IE6700", courseColor: "#DC2626", type: "assignment", date: new Date(2024, 11, 28), time: "11:59 PM" },
  { id: 6, title: "SQL Workshop", course: "IE6700", courseColor: "#DC2626", type: "meeting", date: new Date(2024, 11, 20), time: "6:00 PM", endTime: "8:00 PM" },
  { id: 7, title: "Quiz #4 - Database Design", course: "IE6700", courseColor: "#DC2626", type: "quiz", date: new Date(2024, 11, 21), time: "10:00 AM" },
];

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 11, 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2024, 11, 22));
  const [view, setView] = useState<"month" | "agenda">("month");

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-semibold text-foreground">Calendar</h1>
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
            <h2 className="text-lg font-medium text-foreground">
              {months[month]} {year}
            </h2>
          </div>
          <div className="flex items-center gap-3">
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
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Event
            </Button>
          </div>
        </div>
      </div>

      {view === "month" ? (
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex gap-6">
            {/* Calendar Grid */}
            <div className="flex-1">
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
                          "h-28 p-2 text-left transition-colors hover:bg-muted/30 border-r border-b border-border",
                          dayOfWeek === 6 && "border-r-0",
                          isLastRow && "border-b-0",
                          isSelected(date) && "bg-primary/5 ring-1 ring-inset ring-primary"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium",
                            isToday(date) && "bg-primary text-primary-foreground",
                            !isToday(date) && "text-foreground"
                          )}
                        >
                          {day}
                        </span>
                        <div className="mt-1 space-y-0.5 overflow-hidden">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className="flex items-center gap-1 text-xs truncate"
                            >
                              <div
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: event.courseColor }}
                              />
                              <span className="truncate text-foreground">{event.title}</span>
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="text-xs text-muted-foreground">
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
            <div className="w-80 shrink-0">
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
                          className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
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
                              {event.course} · {event.time}
                              {event.endTime && ` - ${event.endTime}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No events scheduled
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Agenda View */
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {monthEvents.length > 0 ? (
              monthEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors"
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
                      {event.course} · {event.time}
                      {event.endTime && ` - ${event.endTime}`}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No events this month</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
