import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  MoreVertical,
  GripVertical,
  CheckCircle2,
  Circle,
  BookOpen,
  Clock,
  Video,
  HelpCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ModuleItem {
  id: string;
  title: string;
  type: "page" | "discussion" | "assignment" | "quiz" | "video";
  dueDate?: string;
  points?: number;
  published: boolean;
  duration?: string;
}

interface Module {
  id: string;
  title: string;
  items: ModuleItem[];
  published: boolean;
}

const initialModules: Module[] = [
  {
    id: "1",
    title: "Module 1: Project Management Introduction",
    published: true,
    items: [
      { id: "1-1", title: "M1: Readings & Agenda", type: "page", published: true, duration: "15 min" },
      { id: "1-2", title: "M1: Slides", type: "page", published: true, duration: "10 min" },
      { id: "1-3", title: "M1: Video Lecture", type: "video", published: true, duration: "45 min" },
      { id: "1-4", title: "M1 Discussion: Introduce Yourself", type: "discussion", published: true },
    ],
  },
  {
    id: "2",
    title: "Module 2: Project Strategy and Selection",
    published: true,
    items: [
      { id: "2-1", title: "M2: Readings & Agenda", type: "page", published: true, duration: "20 min" },
      { id: "2-2", title: "M2: Slides", type: "page", published: true, duration: "15 min" },
      { id: "2-3", title: "M2: Cases & Example", type: "page", published: true, duration: "30 min" },
      { id: "2-4", title: "M2: Practice Problems and Solutions", type: "page", published: true, duration: "25 min" },
      { id: "2-5", title: "Project Team Formation Report", type: "assignment", dueDate: "Jan 17", points: 30, published: true },
    ],
  },
  {
    id: "3",
    title: "Module 3: The Project Manager",
    published: false,
    items: [
      { id: "3-1", title: "M3: Readings & Agenda", type: "page", published: false, duration: "15 min" },
      { id: "3-2", title: "M3: Video Lecture", type: "video", published: false, duration: "50 min" },
      { id: "3-3", title: "M3: Discussion Forum", type: "discussion", published: false },
      { id: "3-4", title: "M3: Quiz", type: "quiz", dueDate: "Jan 24", points: 25, published: false },
    ],
  },
  {
    id: "4",
    title: "Module 4: Leadership and Team Building",
    published: true,
    items: [
      { id: "4-1", title: "M4: Readings & Agenda", type: "page", published: true, duration: "20 min" },
      { id: "4-2", title: "M4: Slides", type: "page", published: true, duration: "15 min" },
      { id: "4-3", title: "M4: Case Study", type: "page", published: true, duration: "35 min" },
      { id: "4-4", title: "Team Charter Assignment", type: "assignment", dueDate: "Jan 24", points: 50, published: true },
    ],
  },
  {
    id: "5",
    title: "Module 5: Scope Management",
    published: true,
    items: [
      { id: "5-1", title: "M5: Readings & Agenda", type: "page", published: true, duration: "15 min" },
      { id: "5-2", title: "M5: Video Lecture", type: "video", published: true, duration: "55 min" },
      { id: "5-3", title: "WBS Assignment", type: "assignment", dueDate: "Jan 31", points: 75, published: true },
    ],
  },
];

const CourseModules = () => {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [expandedModules, setExpandedModules] = useState<string[]>(modules.map(m => m.id));
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);
  const [addLessonModuleId, setAddLessonModuleId] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const isFaculty = true;

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "discussion":
        return MessageSquare;
      case "video":
        return Video;
      case "assignment":
        return FileText;
      case "quiz":
        return HelpCircle;
      default:
        return BookOpen;
    }
  };

  const getItemColor = (type: string) => {
    switch (type) {
      case "discussion":
        return "bg-primary/10 text-primary";
      case "video":
        return "bg-success/10 text-success";
      case "assignment":
        return "bg-warning/10 text-warning";
      case "quiz":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleEditModule = (moduleId: string, currentTitle: string) => {
    setEditingModuleId(moduleId);
    setEditingTitle(currentTitle);
  };

  const handleSaveModuleTitle = (moduleId: string) => {
    if (!editingTitle.trim()) return;
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, title: editingTitle } : m
      )
    );
    setEditingModuleId(null);
    toast({ title: "Module updated", description: "Module name has been saved." });
  };

  const handleDeleteModule = (moduleId: string) => {
    setModuleToDelete(moduleId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteModule = () => {
    if (moduleToDelete) {
      setModules((prev) => prev.filter((m) => m.id !== moduleToDelete));
      toast({ title: "Module deleted", description: "The module has been removed." });
    }
    setDeleteDialogOpen(false);
    setModuleToDelete(null);
  };

  const handleToggleModulePublish = (moduleId: string) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              published: !m.published,
              items: m.items.map((item) => ({ ...item, published: !m.published })),
            }
          : m
      )
    );
    const module = modules.find((m) => m.id === moduleId);
    toast({
      title: module?.published ? "Module unpublished" : "Module published",
      description: module?.published
        ? "Students can no longer see this module."
        : "Students can now see this module.",
    });
  };

  const handleToggleItemPublish = (moduleId: string, itemId: string) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              items: m.items.map((item) =>
                item.id === itemId ? { ...item, published: !item.published } : item
              ),
            }
          : m
      )
    );
  };

  const handleAddLesson = (moduleId: string) => {
    setAddLessonModuleId(moduleId);
    setNewLessonTitle("");
  };

  const handleSaveNewLesson = () => {
    if (!newLessonTitle.trim() || !addLessonModuleId) return;
    
    setModules((prev) =>
      prev.map((m) =>
        m.id === addLessonModuleId
          ? {
              ...m,
              items: [
                ...m.items,
                {
                  id: `${addLessonModuleId}-${Date.now()}`,
                  title: newLessonTitle,
                  type: "page" as const,
                  published: false,
                  duration: "10 min",
                },
              ],
            }
          : m
      )
    );
    toast({ title: "Lesson added", description: "New lesson has been created." });
    setAddLessonModuleId(null);
    setNewLessonTitle("");
  };

  const handleAddModule = () => {
    const newId = `${Date.now()}`;
    const newModule: Module = {
      id: newId,
      title: `New Module ${modules.length + 1}`,
      published: false,
      items: [],
    };
    setModules((prev) => [...prev, newModule]);
    setExpandedModules((prev) => [...prev, newId]);
    setEditingModuleId(newId);
    setEditingTitle(newModule.title);
    toast({ title: "Module created", description: "New module has been added." });
  };

  const handlePublishAll = () => {
    setModules((prev) =>
      prev.map((m) => ({
        ...m,
        published: true,
        items: m.items.map((item) => ({ ...item, published: true })),
      }))
    );
    toast({ title: "All modules published", description: "All modules are now visible to students." });
  };

  const totalItems = modules.reduce((acc, m) => acc + m.items.length, 0);
  const publishedModules = modules.filter(m => m.published).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">Modules</h1>
            <p className="text-muted-foreground mt-1">Organize and manage course content</p>
          </div>
          {isFaculty && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setExpandedModules([])}>
                Collapse All
              </Button>
              <Button variant="outline" size="sm" onClick={() => setExpandedModules(modules.map(m => m.id))}>
                Expand All
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Publish
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handlePublishAll}>
                    <CheckCircle2 className="h-4 w-4 mr-2 text-success" />
                    Publish All Modules
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setModules((prev) =>
                        prev.map((m) => ({
                          ...m,
                          published: false,
                          items: m.items.map((item) => ({ ...item, published: false })),
                        }))
                      );
                      toast({ title: "All modules unpublished" });
                    }}
                  >
                    <Circle className="h-4 w-4 mr-2 text-muted-foreground" />
                    Unpublish All Modules
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button className="gap-2" onClick={handleAddModule}>
                <Plus className="h-4 w-4" />
                Add Module
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Modules</p>
                  <p className="text-2xl font-bold text-foreground">{modules.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-primary/40" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="text-2xl font-bold text-foreground">{publishedModules}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-success/40" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold text-foreground">{totalItems}</p>
                </div>
                <FileText className="h-8 w-8 text-warning/40" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {modules.map((module, moduleIndex) => {
          const isExpanded = expandedModules.includes(module.id);
          const isEditing = editingModuleId === module.id;
          const completedItems = module.items.filter(i => i.published).length;
          const moduleProgress = module.items.length > 0 ? Math.round((completedItems / module.items.length) * 100) : 0;

          return (
            <Card 
              key={module.id} 
              className={cn(
                "overflow-hidden transition-all",
                !module.published && "opacity-70"
              )}
              style={{ animationDelay: `${moduleIndex * 50}ms` }}
            >
              {/* Module Header */}
              <div className="flex items-center gap-3 px-5 py-4 bg-muted/30">
                {isFaculty && (
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab shrink-0" />
                )}
                <button
                  onClick={() => toggleModule(module.id)}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                {isEditing ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="h-9"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveModuleTitle(module.id);
                        if (e.key === "Escape") setEditingModuleId(null);
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9"
                      onClick={() => handleSaveModuleTitle(module.id)}
                    >
                      <Check className="h-4 w-4 text-success" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9"
                      onClick={() => setEditingModuleId(null)}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-foreground truncate">{module.title}</h3>
                      <Badge
                        className={cn(
                          "text-xs shrink-0",
                          module.published 
                            ? "bg-success/10 text-success border-success/20" 
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {module.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-muted-foreground">{module.items.length} items</span>
                      <div className="flex items-center gap-2 flex-1 max-w-32">
                        <Progress value={moduleProgress} className="h-1.5" />
                        <span className="text-xs text-muted-foreground">{moduleProgress}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {isFaculty && !isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9"
                      onClick={() => handleToggleModulePublish(module.id)}
                    >
                      {module.published ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-9 w-9">
                          <MoreVertical className="h-5 w-5 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditModule(module.id, module.title)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Module Name
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAddLesson(module.id)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Lesson
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleModulePublish(module.id)}>
                          {module.published ? (
                            <>
                              <Circle className="h-4 w-4 mr-2" />
                              Unpublish Module
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2 text-success" />
                              Publish Module
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteModule(module.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Module
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              {/* Module Items */}
              {isExpanded && (
                <div className="divide-y divide-border/50">
                  {module.items.map((item) => {
                    const Icon = getItemIcon(item.type);
                    const colorClass = getItemColor(item.type);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 py-4 px-5 pl-16 hover:bg-muted/20 transition-colors group"
                      >
                        {isFaculty && (
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-foreground font-medium hover:text-primary cursor-pointer transition-colors">
                            {item.title}
                          </span>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            {item.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.duration}
                              </span>
                            )}
                            {item.dueDate && (
                              <span className="flex items-center gap-1">
                                Due {item.dueDate}
                              </span>
                            )}
                            {item.points && (
                              <span>{item.points} pts</span>
                            )}
                          </div>
                        </div>
                        {isFaculty && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleToggleItemPublish(module.id, item.id)}
                            >
                              {item.published ? (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Lesson Row */}
                  {addLessonModuleId === module.id && (
                    <div className="flex items-center gap-3 py-3 px-5 pl-16 bg-muted/20">
                      <Input
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                        placeholder="Enter lesson title..."
                        className="flex-1 h-9"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveNewLesson();
                          if (e.key === "Escape") setAddLessonModuleId(null);
                        }}
                      />
                      <Button size="sm" onClick={handleSaveNewLesson}>
                        Add
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAddLessonModuleId(null)}>
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Add Lesson Button */}
                  {isFaculty && addLessonModuleId !== module.id && (
                    <button
                      onClick={() => handleAddLesson(module.id)}
                      className="w-full flex items-center gap-3 py-3 px-5 pl-16 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add lesson or content
                    </button>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add Module Button */}
      {isFaculty && (
        <Button 
          variant="outline" 
          className="w-full mt-6 border-dashed border-2 h-14 text-muted-foreground hover:text-foreground hover:border-primary hover:bg-primary/5"
          onClick={handleAddModule}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add New Module
        </Button>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Module</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this module? This action cannot be undone
              and all content within the module will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteModule}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseModules;
