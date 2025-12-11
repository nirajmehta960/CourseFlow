import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  FileText,
  HelpCircle,
  Video,
  Settings,
  BookOpen,
  Clock,
  TrendingUp,
  Users,
  Calendar,
  Play,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  title: string;
  published: boolean;
  items: ModuleItem[];
}

interface ModuleItem {
  id: string;
  title: string;
  type: "lesson" | "assignment" | "quiz" | "file" | "video";
  completed: boolean;
  dueDate?: string;
  duration?: string;
}

const modules: Module[] = [
  {
    id: "1",
    title: "Module 1: Fuel and Combustion",
    published: true,
    items: [
      { id: "1-1", title: "Rocket Fuel Fundamentals", type: "lesson", completed: true, duration: "15 min" },
      { id: "1-2", title: "Combustion Processes", type: "lesson", completed: true, duration: "20 min" },
      { id: "1-3", title: "Combustion Instability", type: "video", completed: false, duration: "12 min" },
      { id: "1-4", title: "Module 1 Quiz", type: "quiz", completed: false, dueDate: "Dec 24" },
    ],
  },
  {
    id: "2",
    title: "Module 2: Nozzle Design",
    published: true,
    items: [
      { id: "2-1", title: "Nozzle Design Basics", type: "lesson", completed: false, duration: "25 min" },
      { id: "2-2", title: "Nozzle Performance Analysis", type: "lesson", completed: false, duration: "30 min" },
      { id: "2-3", title: "Design Assignment", type: "assignment", completed: false, dueDate: "Dec 28" },
    ],
  },
  {
    id: "3",
    title: "Module 3: Propulsion Systems",
    published: false,
    items: [
      { id: "3-1", title: "Solid Propulsion", type: "lesson", completed: false, duration: "20 min" },
      { id: "3-2", title: "Liquid Propulsion", type: "lesson", completed: false, duration: "22 min" },
      { id: "3-3", title: "Hybrid Systems", type: "lesson", completed: false, duration: "18 min" },
    ],
  },
];

const upcomingDeadlines = [
  { title: "Module 1 Quiz", type: "quiz", dueDate: "Dec 24, 2024", dueTime: "11:59 PM" },
  { title: "Design Assignment", type: "assignment", dueDate: "Dec 28, 2024", dueTime: "11:59 PM" },
  { title: "Midterm Exam", type: "exam", dueDate: "Jan 5, 2025", dueTime: "10:00 AM" },
];

const getItemIcon = (type: string) => {
  switch (type) {
    case "quiz":
      return HelpCircle;
    case "assignment":
      return FileText;
    case "video":
      return Video;
    default:
      return BookOpen;
  }
};

const getItemColor = (type: string) => {
  switch (type) {
    case "quiz":
      return "text-warning";
    case "assignment":
      return "text-primary";
    case "video":
      return "text-success";
    default:
      return "text-muted-foreground";
  }
};

const CourseHome = () => {
  const [expandedModules, setExpandedModules] = useState<string[]>(["1", "2"]);
  const isFaculty = true;

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const totalItems = modules.reduce((acc, m) => acc + m.items.length, 0);
  const completedItems = modules.reduce(
    (acc, m) => acc + m.items.filter((i) => i.completed).length,
    0
  );
  const progressPercent = Math.round((completedItems / totalItems) * 100);

  return (
    <div className="flex min-h-full bg-background">
      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-semibold text-foreground mb-2">
            Welcome back to your course
          </h1>
          <p className="text-muted-foreground">
            Continue where you left off and track your progress
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Progress</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{progressPercent}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
              <Progress value={progressPercent} className="h-1.5 mt-4" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Completed</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{completedItems}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">of {totalItems} total items</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Due Soon</p>
                  <p className="text-3xl font-bold text-foreground mt-1">3</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">assignments this week</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/50 to-secondary/30 border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Modules</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{modules.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">{modules.filter(m => m.published).length} published</p>
            </CardContent>
          </Card>
        </div>

        {/* Continue Learning Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Continue Learning</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              View all modules
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Play className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <Badge variant="outline" className="mb-2 text-primary border-primary/30">
                    Module 1
                  </Badge>
                  <h3 className="font-semibold text-foreground text-lg">Combustion Instability</h3>
                  <p className="text-sm text-muted-foreground mt-1">Continue from where you left off • 12 min remaining</p>
                </div>
                <Button className="shrink-0">
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modules List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Course Modules</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setExpandedModules([])}>
                Collapse All
              </Button>
              <Button variant="outline" size="sm" onClick={() => setExpandedModules(modules.map(m => m.id))}>
                Expand All
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {modules.map((module, moduleIndex) => {
              const isExpanded = expandedModules.includes(module.id);
              const moduleCompleted = module.items.filter((i) => i.completed).length;
              const moduleTotal = module.items.length;
              const moduleProgress = Math.round((moduleCompleted / moduleTotal) * 100);

              return (
                <Card 
                  key={module.id} 
                  className={cn(
                    "overflow-hidden transition-all duration-200",
                    !module.published && "opacity-60"
                  )}
                  style={{ animationDelay: `${moduleIndex * 50}ms` }}
                >
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                        moduleProgress === 100 ? "bg-success/20" : "bg-primary/10"
                      )}>
                        {moduleProgress === 100 ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-primary" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{module.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {moduleCompleted}/{moduleTotal} complete
                          </span>
                          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all",
                                moduleProgress === 100 ? "bg-success" : "bg-primary"
                              )}
                              style={{ width: `${moduleProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={module.published ? "default" : "secondary"}
                      className={cn(
                        "text-xs",
                        module.published && "bg-success/10 text-success border-success/20 hover:bg-success/20"
                      )}
                    >
                      {module.published ? "Published" : "Draft"}
                    </Badge>
                  </button>

                  {/* Module Items */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/10">
                      {module.items.map((item, index) => {
                        const ItemIcon = getItemIcon(item.type);
                        const iconColor = getItemColor(item.type);
                        return (
                          <div
                            key={item.id}
                            className={cn(
                              "flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer group",
                              index !== module.items.length - 1 && "border-b border-border/50"
                            )}
                          >
                            <div className="ml-14 flex items-center gap-4 flex-1">
                              {item.completed ? (
                                <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center">
                                  <CheckCircle2 className="h-4 w-4 text-success" />
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                  <Circle className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <div className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center",
                                item.type === "video" && "bg-success/10",
                                item.type === "quiz" && "bg-warning/10",
                                item.type === "assignment" && "bg-primary/10",
                                item.type === "lesson" && "bg-muted"
                              )}>
                                <ItemIcon className={cn("h-4 w-4", iconColor)} />
                              </div>
                              <div className="flex-1">
                                <span className={cn(
                                  "text-sm font-medium",
                                  item.completed ? "text-muted-foreground" : "text-foreground"
                                )}>
                                  {item.title}
                                </span>
                                {item.duration && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{item.duration}</p>
                                )}
                              </div>
                            </div>
                            {item.dueDate && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Due {item.dueDate}
                              </Badge>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Add Module (Faculty only) */}
          {isFaculty && (
            <Button variant="outline" className="w-full mt-4 border-dashed border-2 h-12 hover:border-primary hover:bg-primary/5">
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 border-l border-border p-6 bg-muted/20">
        {/* Upcoming Deadlines */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingDeadlines.map((deadline, index) => (
              <div key={index} className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                  deadline.type === "quiz" && "bg-warning/10",
                  deadline.type === "assignment" && "bg-primary/10",
                  deadline.type === "exam" && "bg-destructive/10"
                )}>
                  {deadline.type === "quiz" && <HelpCircle className="h-5 w-5 text-warning" />}
                  {deadline.type === "assignment" && <FileText className="h-5 w-5 text-primary" />}
                  {deadline.type === "exam" && <BookOpen className="h-5 w-5 text-destructive" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{deadline.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {deadline.dueDate} • {deadline.dueTime}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Faculty Controls */}
        {isFaculty && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                Course Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Course Settings
              </Button>
              <Button size="sm" className="w-full bg-success hover:bg-success/90">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Publish Course
              </Button>

              <div className="pt-4 border-t border-border">
                <h4 className="font-medium text-foreground text-sm mb-3">Quick Stats</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Students
                    </span>
                    <span className="font-semibold text-foreground">45</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Modules
                    </span>
                    <span className="font-semibold text-foreground">{modules.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Assignments
                    </span>
                    <span className="font-semibold text-foreground">8</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CourseHome;
