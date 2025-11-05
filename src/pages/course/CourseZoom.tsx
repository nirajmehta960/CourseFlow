import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Video, 
  Plus, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Users,
  Play,
  History,
  Settings,
  Copy,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCoursePermissions } from "@/hooks/useCoursePermissions";

const meetings = [
  {
    id: 1,
    title: "Weekly Lecture",
    type: "recurring",
    day: "Tuesday & Thursday",
    time: "10:00 AM - 11:30 AM",
    nextSession: "Dec 24, 2024",
    participants: 45,
    link: "#",
    host: {
      name: "Dr. Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
    },
    isLive: true,
  },
  {
    id: 2,
    title: "Office Hours",
    type: "recurring",
    day: "Friday",
    time: "2:00 PM - 4:00 PM",
    nextSession: "Dec 27, 2024",
    participants: 12,
    link: "#",
    host: {
      name: "Michael Torres",
    },
    isLive: false,
  },
  {
    id: 3,
    title: "Lab Session - Section A",
    type: "recurring",
    day: "Monday",
    time: "3:00 PM - 5:00 PM",
    nextSession: "Dec 23, 2024",
    participants: 22,
    link: "#",
    host: {
      name: "Dr. Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
    },
    isLive: false,
  },
];

const upcomingSessions = [
  {
    id: 1,
    title: "Review Session: Nozzle Design",
    date: "Dec 22, 2024",
    time: "4:00 PM",
    duration: "60 min",
    host: "Dr. Sarah Chen",
  },
  {
    id: 2,
    title: "Q&A: Final Project",
    date: "Dec 28, 2024",
    time: "3:00 PM",
    duration: "45 min",
    host: "Michael Torres (TA)",
  },
  {
    id: 3,
    title: "Pre-Exam Review",
    date: "Jan 2, 2025",
    time: "10:00 AM",
    duration: "90 min",
    host: "Dr. Sarah Chen",
  },
];

const pastRecordings = [
  {
    id: 1,
    title: "Lecture 12: Combustion Efficiency",
    date: "Dec 19, 2024",
    duration: "1h 25m",
    views: 38,
  },
  {
    id: 2,
    title: "Lecture 11: Nozzle Performance",
    date: "Dec 17, 2024",
    duration: "1h 30m",
    views: 42,
  },
  {
    id: 3,
    title: "Lab Session: Data Analysis",
    date: "Dec 16, 2024",
    duration: "1h 45m",
    views: 21,
  },
];

const CourseZoom = () => {
  const { isInstructor: isFaculty } = useCoursePermissions();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">Zoom Meetings</h1>
            <p className="text-muted-foreground mt-1">Join live sessions and access recordings</p>
          </div>
          {isFaculty && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Schedule Meeting
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="text-2xl font-bold text-foreground">{meetings.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Live Now</p>
                  <p className="text-2xl font-bold text-foreground">{meetings.filter(m => m.isLive).length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center animate-pulse">
                  <Video className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold text-foreground">{upcomingSessions.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary/50 to-secondary/30 border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Recordings</p>
                  <p className="text-2xl font-bold text-foreground">{pastRecordings.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <History className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recurring Meetings */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="font-semibold text-foreground mb-4">Recurring Meetings</h3>
            <div className="space-y-4">
              {meetings.map((meeting, index) => (
                <Card 
                  key={meeting.id} 
                  className={cn(
                    "hover:shadow-lg transition-all group",
                    meeting.isLive && "border-success/50 ring-1 ring-success/20"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-4 rounded-xl",
                          meeting.isLive ? "bg-success/10" : "bg-primary/10"
                        )}>
                          <Video className={cn(
                            "h-6 w-6",
                            meeting.isLive ? "text-success" : "text-primary"
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-foreground text-lg">
                              {meeting.title}
                            </h4>
                            {meeting.isLive && (
                              <Badge className="bg-success text-success-foreground animate-pulse">
                                LIVE
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {meeting.day}
                            </p>
                            <p className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {meeting.time}
                            </p>
                            <p className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {meeting.participants} participants
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={meeting.host.avatar} />
                              <AvatarFallback className="text-xs">{getInitials(meeting.host.name)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">Hosted by {meeting.host.name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <Badge variant="outline" className="text-xs">
                          Recurring
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Next: {meeting.nextSession}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="gap-1">
                            <Copy className="h-3 w-3" />
                            Copy Link
                          </Button>
                          <Button 
                            size="sm" 
                            className={cn(
                              "gap-1",
                              meeting.isLive && "bg-success hover:bg-success/90"
                            )}
                          >
                            {meeting.isLive ? "Join Now" : "Join"}
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Past Recordings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Past Recordings</h3>
              <Button variant="ghost" size="sm" className="text-primary">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {pastRecordings.map((recording) => (
                  <div 
                    key={recording.id} 
                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Play className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {recording.title}
                      </h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>{recording.date}</span>
                        <span>•</span>
                        <span>{recording.duration}</span>
                        <span>•</span>
                        <span>{recording.views} views</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Watch
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming One-time Sessions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Upcoming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-start gap-3 pb-4 border-b border-border/50 last:border-0 last:pb-0"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Video className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm truncate">
                      {session.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {session.date} at {session.time}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.duration} • {session.host}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Video className="h-4 w-4 text-primary" />
                Start Instant Meeting
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                View All Recordings
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Sync with Calendar
              </Button>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardContent className="p-5">
              <h4 className="font-semibold text-foreground mb-2">Need Help?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Having trouble joining a meeting? Check our troubleshooting guide.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Get Help
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseZoom;
