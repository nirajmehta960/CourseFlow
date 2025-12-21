import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
import { getModules, updateModules, addModule, addModuleItem, Module, ModuleItem, ModuleItemType } from "@/lib/modules-api";
import { getErrorMessage } from "@/lib/api";
import { useCoursePermissions } from "@/hooks/useCoursePermissions";

// Map backend types to frontend display types
const mapItemType = (type: ModuleItemType): "page" | "discussion" | "assignment" | "quiz" | "video" => {
  switch (type) {
    case "VIDEO":
      return "video";
    case "QUIZ":
      return "quiz";
    case "ASSIGNMENT":
      return "assignment";
    case "DOC":
      return "page";
    case "LINK":
      return "discussion";
    default:
      return "page";
  }
};

const CourseModules = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);
  const [addLessonModuleId, setAddLessonModuleId] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const { isInstructor: isFaculty } = useCoursePermissions();

  // Fetch modules on mount
  useEffect(() => {
    const fetchModules = async () => {
      if (!courseId) return;
      
      try {
        setLoading(true);
        const response = await getModules(courseId);
        // Sort modules by position
        const sortedModules = [...response.modules].sort((a, b) => a.position - b.position);
        setModules(sortedModules);
        // Expand all modules by default
        setExpandedModules(sortedModules.map(m => m.moduleId));
      } catch (error) {
        console.error("Failed to fetch modules:", error);
        toast({
          title: "Error",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [courseId]);

  // Helper function to save modules to backend
  const saveModules = async (updatedModules: Module[]) => {
    if (!courseId) return;
    
    try {
      // Convert to backend format
      const backendModules = updatedModules.map((module, index) => ({
        moduleId: module.moduleId,
        title: module.title,
        position: index,
        items: module.items.map((item) => ({
          itemId: item.itemId,
          type: item.type,
          title: item.title,
          url: item.url,
          dueDate: item.dueDate,
          published: item.published,
        })),
      }));

      const response = await updateModules(courseId, { modules: backendModules });
      // Sort modules by position
      const sortedModules = [...response.modules].sort((a, b) => a.position - b.position);
      setModules(sortedModules);
    } catch (error) {
      console.error("Failed to save modules:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      throw error;
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getItemIcon = (type: ModuleItemType) => {
    switch (type) {
      case "LINK":
        return MessageSquare;
      case "VIDEO":
        return Video;
      case "ASSIGNMENT":
        return FileText;
      case "QUIZ":
        return HelpCircle;
      default:
        return BookOpen;
    }
  };

  const getItemColor = (type: ModuleItemType) => {
    switch (type) {
      case "LINK":
        return "bg-primary/10 text-primary";
      case "VIDEO":
        return "bg-success/10 text-success";
      case "ASSIGNMENT":
        return "bg-warning/10 text-warning";
      case "QUIZ":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleEditModule = (moduleId: string, currentTitle: string) => {
    setEditingModuleId(moduleId);
    setEditingTitle(currentTitle);
  };

  const handleSaveModuleTitle = async (moduleId: string) => {
    if (!editingTitle.trim()) return;
    
    const updatedModules = modules.map((m) =>
      m.moduleId === moduleId ? { ...m, title: editingTitle } : m
    );
    
    try {
      await saveModules(updatedModules);
      setEditingModuleId(null);
      toast({ title: "Module updated", description: "Module name has been saved." });
    } catch (error) {
      // Error already handled in saveModules
    }
  };

  const handleDeleteModule = (moduleId: string) => {
    setModuleToDelete(moduleId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteModule = async () => {
    if (moduleToDelete) {
      const updatedModules = modules.filter((m) => m.moduleId !== moduleToDelete);
      try {
        await saveModules(updatedModules);
        toast({ title: "Module deleted", description: "The module has been removed." });
      } catch (error) {
        // Error already handled in saveModules
      }
    }
    setDeleteDialogOpen(false);
    setModuleToDelete(null);
  };

  const handleToggleModulePublish = async (moduleId: string) => {
    const module = modules.find((m) => m.moduleId === moduleId);
    if (!module) return;
    
    const newPublishedState = !module.items.some(i => i.published);
    
    const updatedModules = modules.map((m) =>
      m.moduleId === moduleId
        ? {
            ...m,
            items: m.items.map((item) => ({ ...item, published: newPublishedState })),
          }
        : m
    );
    
    try {
      await saveModules(updatedModules);
      toast({
        title: newPublishedState ? "Module published" : "Module unpublished",
        description: newPublishedState
          ? "Students can now see this module."
          : "Students can no longer see this module.",
      });
    } catch (error) {
      // Error already handled in saveModules
    }
  };

  const handleToggleItemPublish = async (moduleId: string, itemId: string) => {
    const updatedModules = modules.map((m) =>
      m.moduleId === moduleId
        ? {
            ...m,
            items: m.items.map((item) =>
              item.itemId === itemId ? { ...item, published: !item.published } : item
            ),
          }
        : m
    );
    
    try {
      await saveModules(updatedModules);
    } catch (error) {
      // Error already handled in saveModules
    }
  };

  const handleAddLesson = (moduleId: string) => {
    setAddLessonModuleId(moduleId);
    setNewLessonTitle("");
  };

  const handleSaveNewLesson = async () => {
    if (!newLessonTitle.trim() || !addLessonModuleId || !courseId) return;
    
    try {
      await addModuleItem(courseId, addLessonModuleId, {
        title: newLessonTitle,
        type: "DOC",
        published: false,
      });
      
      // Refresh modules
      const response = await getModules(courseId);
      const sortedModules = [...response.modules].sort((a, b) => a.position - b.position);
      setModules(sortedModules);
      
      toast({ title: "Lesson added", description: "New lesson has been created." });
      setAddLessonModuleId(null);
      setNewLessonTitle("");
    } catch (error) {
      console.error("Failed to add lesson:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleAddModule = async () => {
    if (!courseId) return;
    
    try {
      const response = await addModule(courseId, {
        title: `New Module ${modules.length + 1}`,
        position: modules.length,
      });
      
      // Sort modules by position
      const sortedModules = [...response.modules].sort((a, b) => a.position - b.position);
      setModules(sortedModules);
      
      const newModule = sortedModules[sortedModules.length - 1];
      setExpandedModules((prev) => [...prev, newModule.moduleId]);
      setEditingModuleId(newModule.moduleId);
      setEditingTitle(newModule.title);
      
      toast({ title: "Module created", description: "New module has been added." });
    } catch (error) {
      console.error("Failed to add module:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handlePublishAll = async () => {
    const updatedModules = modules.map((m) => ({
      ...m,
      items: m.items.map((item) => ({ ...item, published: true })),
    }));
    
    try {
      await saveModules(updatedModules);
      toast({ title: "All modules published", description: "All modules are now visible to students." });
    } catch (error) {
      // Error already handled in saveModules
    }
  };

  const totalItems = modules.reduce((acc, m) => acc + m.items.length, 0);
  const publishedModules = modules.filter(m => m.items.some(i => i.published)).length;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading modules...</p>
      </div>
    );
  }

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
              <Button variant="outline" size="sm" onClick={() => setExpandedModules(modules.map(m => m.moduleId))}>
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
                    onClick={async () => {
                      const updatedModules = modules.map((m) => ({
                        ...m,
                        items: m.items.map((item) => ({ ...item, published: false })),
                      }));
                      try {
                        await saveModules(updatedModules);
                        toast({ title: "All modules unpublished" });
                      } catch (error) {
                        // Error already handled in saveModules
                      }
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
          const isExpanded = expandedModules.includes(module.moduleId);
          const isEditing = editingModuleId === module.moduleId;
          const publishedItems = module.items.filter(i => i.published).length;
          const moduleProgress = module.items.length > 0 ? Math.round((publishedItems / module.items.length) * 100) : 0;
          const hasPublishedItems = module.items.some(i => i.published);

          return (
            <Card 
              key={module.moduleId} 
              className={cn(
                "overflow-hidden transition-all",
                !hasPublishedItems && "opacity-70"
              )}
              style={{ animationDelay: `${moduleIndex * 50}ms` }}
            >
              {/* Module Header */}
              <div className="flex items-center gap-3 px-5 py-4 bg-muted/30">
                {isFaculty && (
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab shrink-0" />
                )}
                <button
                  onClick={() => toggleModule(module.moduleId)}
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
                        if (e.key === "Enter") handleSaveModuleTitle(module.moduleId);
                        if (e.key === "Escape") setEditingModuleId(null);
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9"
                      onClick={() => handleSaveModuleTitle(module.moduleId)}
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
                          hasPublishedItems 
                            ? "bg-success/10 text-success border-success/20" 
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {hasPublishedItems ? "Published" : "Draft"}
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
                      onClick={() => handleToggleModulePublish(module.moduleId)}
                    >
                      {hasPublishedItems ? (
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
                        <DropdownMenuItem onClick={() => handleEditModule(module.moduleId, module.title)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Module Name
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAddLesson(module.moduleId)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Lesson
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleModulePublish(module.moduleId)}>
                          {hasPublishedItems ? (
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
                          onClick={() => handleDeleteModule(module.moduleId)}
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
                        key={item.itemId}
                        className={cn(
                          "flex items-center gap-4 py-4 px-5 pl-16 hover:bg-muted/20 transition-colors group",
                          !item.published && "opacity-60"
                        )}
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
                            {item.dueDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Due {new Date(item.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {isFaculty && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleToggleItemPublish(module.moduleId, item.itemId)}
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
                  {addLessonModuleId === module.moduleId && (
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
                  {isFaculty && addLessonModuleId !== module.moduleId && (
                    <button
                      onClick={() => handleAddLesson(module.moduleId)}
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
