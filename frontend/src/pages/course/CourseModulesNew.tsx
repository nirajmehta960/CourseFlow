import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  GripVertical,
  Lock,
  Unlock,
  FileText,
  HelpCircle,
  Video,
  Link as LinkIcon,
  File,
  BookOpen,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  getModules,
  createModule,
  updateModule,
  deleteModule,
  createModuleItem,
  updateModuleItem,
  deleteModuleItem,
  reorderModules,
  Module,
  ModuleItem,
  ModuleItemType,
  CreateModuleRequest,
  CreateModuleItemRequest,
  ReorderRequest,
} from "@/lib/modules-api";
import { getErrorMessage } from "@/lib/api";
import { useCoursePermissions } from "@/hooks/useCoursePermissions";
import { format, parseISO } from "date-fns";

const CourseModulesNew = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [createModuleDialogOpen, setCreateModuleDialogOpen] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState<string | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [draggedModuleId, setDraggedModuleId] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedItemModuleId, setDraggedItemModuleId] = useState<string | null>(null);
  const { isInstructor: isFaculty } = useCoursePermissions();

  // Form states
  const [moduleForm, setModuleForm] = useState<CreateModuleRequest>({
    title: "",
    published: false,
  });
  const [itemForm, setItemForm] = useState<CreateModuleItemRequest>({
    title: "",
    type: "PAGE",
    published: false,
  });

  useEffect(() => {
    fetchModules();
  }, [courseId]);

  const fetchModules = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      const response = await getModules(courseId);
      setModules(response.modules);
      // Expand all modules by default
      setExpandedModules(new Set(response.modules.map((m) => m.id)));
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

  const handleCreateModule = async () => {
    if (!courseId || !moduleForm.title.trim()) return;

    try {
      const newModule = await createModule(courseId, moduleForm);
      setModules((prev) => [...prev, newModule].sort((a, b) => a.position - b.position));
      setCreateModuleDialogOpen(false);
      setModuleForm({ title: "", published: false });
      toast({
        title: "Success",
        description: "Module created successfully",
      });
    } catch (error) {
      console.error("Failed to create module:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleUpdateModule = async (moduleId: string, updates: { title?: string; published?: boolean; unlockAt?: string }) => {
    try {
      const updated = await updateModule(moduleId, updates);
      setModules((prev) =>
        prev.map((m) => (m.id === moduleId ? updated : m)).sort((a, b) => a.position - b.position)
      );
      toast({
        title: "Success",
        description: "Module updated successfully",
      });
    } catch (error) {
      console.error("Failed to update module:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module? All items will be deleted.")) {
      return;
    }

    try {
      await deleteModule(moduleId);
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
      toast({
        title: "Success",
        description: "Module deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete module:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleCreateItem = async (moduleId: string) => {
    if (!itemForm.title.trim()) return;

    try {
      const newItem = await createModuleItem(moduleId, itemForm);
      setModules((prev) =>
        prev.map((module) => {
          if (module.id === moduleId) {
            return {
              ...module,
              items: [...module.items, newItem].sort((a, b) => a.position - b.position),
            };
          }
          return module;
        })
      );
      setAddItemDialogOpen(null);
      setItemForm({ title: "", type: "PAGE", published: false });
      toast({
        title: "Success",
        description: "Item added successfully",
      });
    } catch (error) {
      console.error("Failed to create item:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleUpdateItem = async (itemId: string, updates: { title?: string; published?: boolean }) => {
    try {
      const updated = await updateModuleItem(itemId, updates);
      setModules((prev) =>
        prev.map((module) => ({
          ...module,
          items: module.items.map((item) => (item.id === itemId ? updated : item)),
        }))
      );
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
    } catch (error) {
      console.error("Failed to update item:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string, itemTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${itemTitle}"?`)) {
      return;
    }

    try {
      await deleteModuleItem(itemId);
      setModules((prev) =>
        prev.map((module) => ({
          ...module,
          items: module.items.filter((item) => item.id !== itemId),
        }))
      );
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const handleReorder = async () => {
    if (!courseId) return;

    try {
      const moduleOrder = modules.map((m) => m.id);
      const itemOrders: Record<string, string[]> = {};
      
      modules.forEach((module) => {
        itemOrders[module.id] = module.items.map((item) => item.id);
      });

      const response = await reorderModules(courseId, {
        moduleOrder,
        itemOrders,
      });
      
      setModules(response.modules);
      toast({
        title: "Success",
        description: "Modules reordered successfully",
      });
    } catch (error) {
      console.error("Failed to reorder modules:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleModuleDragStart = (e: React.DragEvent, moduleId: string) => {
    setDraggedModuleId(moduleId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleModuleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleModuleDrop = async (e: React.DragEvent, targetModuleId: string) => {
    e.preventDefault();
    if (!draggedModuleId || draggedModuleId === targetModuleId || !courseId) return;

    const draggedIndex = modules.findIndex((m) => m.id === draggedModuleId);
    const targetIndex = modules.findIndex((m) => m.id === targetModuleId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newModules = [...modules];
    const [removed] = newModules.splice(draggedIndex, 1);
    newModules.splice(targetIndex, 0, removed);

    // Update positions
    const updatedModules = newModules.map((module, index) => ({
      ...module,
      position: index,
    }));

    setModules(updatedModules);
    setDraggedModuleId(null);

    // Save to backend
    try {
      const moduleOrder = updatedModules.map((m) => m.id);
      const itemOrders: Record<string, string[]> = {};
      updatedModules.forEach((module) => {
        itemOrders[module.id] = module.items.map((item) => item.id);
      });

      await reorderModules(courseId, { moduleOrder, itemOrders });
    } catch (error) {
      console.error("Failed to save reorder:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      fetchModules(); // Revert on error
    }
  };

  const handleItemDragStart = (e: React.DragEvent, itemId: string, moduleId: string) => {
    setDraggedItemId(itemId);
    setDraggedItemModuleId(moduleId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleItemDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleItemDrop = async (e: React.DragEvent, targetItemId: string, targetModuleId: string) => {
    e.preventDefault();
    if (!draggedItemId || !draggedItemModuleId || draggedItemId === targetItemId || !courseId) return;

    const targetModule = modules.find((m) => m.id === targetModuleId);
    if (!targetModule) return;

    const draggedItem = targetModule.items.find((i) => i.id === draggedItemId);
    if (!draggedItem) return;

    const draggedIndex = targetModule.items.findIndex((i) => i.id === draggedItemId);
    const targetIndex = targetModule.items.findIndex((i) => i.id === targetItemId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...targetModule.items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    // Update positions
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      position: index,
    }));

    setModules((prev) =>
      prev.map((module) =>
        module.id === targetModuleId ? { ...module, items: updatedItems } : module
      )
    );

    setDraggedItemId(null);
    setDraggedItemModuleId(null);

    // Save to backend
    try {
      const moduleOrder = modules.map((m) => m.id);
      const itemOrders: Record<string, string[]> = {};
      modules.forEach((module) => {
        if (module.id === targetModuleId) {
          itemOrders[module.id] = updatedItems.map((item) => item.id);
        } else {
          itemOrders[module.id] = module.items.map((item) => item.id);
        }
      });

      await reorderModules(courseId, { moduleOrder, itemOrders });
    } catch (error) {
      console.error("Failed to save item reorder:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      fetchModules(); // Revert on error
    }
  };

  const getItemIcon = (type: ModuleItemType) => {
    switch (type) {
      case "ASSIGNMENT":
        return FileText;
      case "QUIZ":
        return HelpCircle;
      case "VIDEO":
        return Video;
      case "URL":
        return LinkIcon;
      case "FILE":
        return File;
      default:
        return BookOpen;
    }
  };

  const getItemColor = (type: ModuleItemType) => {
    switch (type) {
      case "ASSIGNMENT":
        return "text-primary";
      case "QUIZ":
        return "text-warning";
      case "VIDEO":
        return "text-success";
      case "URL":
        return "text-info";
      case "FILE":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading modules...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">Modules</h1>
          <p className="text-muted-foreground mt-1">Organize your course content</p>
        </div>
        {isFaculty && (
          <Dialog open={createModuleDialogOpen} onOpenChange={setCreateModuleDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Module</DialogTitle>
                <DialogDescription>Add a new module to organize your course content</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="module-title">Module Title</Label>
                  <Input
                    id="module-title"
                    placeholder="e.g., Week 1: Introduction"
                    value={moduleForm.title}
                    onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="module-published"
                    checked={moduleForm.published}
                    onCheckedChange={(checked) => setModuleForm({ ...moduleForm, published: checked })}
                  />
                  <Label htmlFor="module-published">Published</Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="module-unlock">Unlock Date (optional)</Label>
                  <Input
                    id="module-unlock"
                    type="datetime-local"
                    value={moduleForm.unlockAt ? new Date(moduleForm.unlockAt).toISOString().slice(0, 16) : ""}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                      setModuleForm({ ...moduleForm, unlockAt: date });
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateModuleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateModule} disabled={!moduleForm.title.trim()}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {modules.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No modules yet</h3>
            <p className="text-muted-foreground mb-6">
              {isFaculty
                ? "Create your first module to organize course content"
                : "No modules available in this course"}
            </p>
            {isFaculty && (
              <Button onClick={() => setCreateModuleDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Module
              </Button>
            )}
          </div>
        ) : (
          modules.map((module) => {
            const isExpanded = expandedModules.has(module.id);
            const isEditing = editingModuleId === module.id;
            const isLocked = module.unlockAt && new Date(module.unlockAt) > new Date();

            return (
              <div
                key={module.id}
                className="border border-border rounded-lg bg-card overflow-hidden"
                draggable={isFaculty}
                onDragStart={(e) => isFaculty && handleModuleDragStart(e, module.id)}
                onDragOver={isFaculty ? handleModuleDragOver : undefined}
                onDrop={(e) => isFaculty && handleModuleDrop(e, module.id)}
              >
                {/* Module Header */}
                <div className="p-4 bg-muted/30 border-b border-border">
                  <div className="flex items-center gap-3">
                    {isFaculty && (
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    )}
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="flex-1 flex items-center gap-2 text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      {isEditing ? (
                        <Input
                          value={module.title}
                          onChange={(e) => {
                            setModules((prev) =>
                              prev.map((m) =>
                                m.id === module.id ? { ...m, title: e.target.value } : m
                              )
                            );
                          }}
                          onBlur={() => {
                            const updatedModule = modules.find((m) => m.id === module.id);
                            if (updatedModule) {
                              handleUpdateModule(module.id, { title: updatedModule.title });
                            }
                            setEditingModuleId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            } else if (e.key === "Escape") {
                              setEditingModuleId(null);
                              fetchModules();
                            }
                          }}
                          className="flex-1"
                          autoFocus
                        />
                      ) : (
                        <h3 className="font-semibold text-foreground flex-1">{module.title}</h3>
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      {isLocked && (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          {module.unlockAt && format(parseISO(module.unlockAt), "MMM d, yyyy")}
                        </Badge>
                      )}
                      <Badge variant={module.published ? "default" : "secondary"}>
                        {module.published ? "Published" : "Draft"}
                      </Badge>
                      {isFaculty && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingModuleId(module.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Title
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateModule(module.id, { published: !module.published })
                              }
                            >
                              {module.published ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Publish
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteModule(module.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>

                {/* Module Items */}
                {isExpanded && (
                  <div className="divide-y divide-border">
                    {module.items.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-muted-foreground mb-4">No items in this module</p>
                        {isFaculty && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAddItemDialogOpen(module.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                          </Button>
                        )}
                      </div>
                    ) : (
                      module.items.map((item) => {
                        const ItemIcon = getItemIcon(item.type);
                        const iconColor = getItemColor(item.type);
                        const isEditingItem = editingItemId === item.id;

                        return (
                          <div
                            key={item.id}
                            className="p-4 hover:bg-muted/30 transition-colors flex items-center gap-3"
                            draggable={isFaculty}
                            onDragStart={(e) => isFaculty && handleItemDragStart(e, item.id, module.id)}
                            onDragOver={isFaculty ? handleItemDragOver : undefined}
                            onDrop={(e) => isFaculty && handleItemDrop(e, item.id, module.id)}
                          >
                            {isFaculty && (
                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                            )}
                            <div className={cn("h-8 w-8 rounded flex items-center justify-center", iconColor)}>
                              <ItemIcon className="h-4 w-4" />
                            </div>
                            {isEditingItem ? (
                              <Input
                                value={item.title}
                                onChange={(e) => {
                                  setModules((prev) =>
                                    prev.map((m) => ({
                                      ...m,
                                      items: m.items.map((i) =>
                                        i.id === item.id ? { ...i, title: e.target.value } : i
                                      ),
                                    }))
                                  );
                                }}
                                onBlur={() => {
                                  const updatedItem = modules
                                    .flatMap((m) => m.items)
                                    .find((i) => i.id === item.id);
                                  if (updatedItem) {
                                    handleUpdateItem(item.id, { title: updatedItem.title });
                                  }
                                  setEditingItemId(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.currentTarget.blur();
                                  } else if (e.key === "Escape") {
                                    setEditingItemId(null);
                                    fetchModules();
                                  }
                                }}
                                className="flex-1"
                                autoFocus
                              />
                            ) : (
                              <span className="flex-1 text-foreground">{item.title}</span>
                            )}
                            <div className="flex items-center gap-2">
                              <Badge variant={item.published ? "default" : "secondary"} className="text-xs">
                                {item.published ? "Published" : "Draft"}
                              </Badge>
                              {isFaculty && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditingItemId(item.id)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Title
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleUpdateItem(item.id, { published: !item.published })
                                      }
                                    >
                                      {item.published ? (
                                        <>
                                          <EyeOff className="h-4 w-4 mr-2" />
                                          Unpublish
                                        </>
                                      ) : (
                                        <>
                                          <Eye className="h-4 w-4 mr-2" />
                                          Publish
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteItem(item.id, item.title)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    {isFaculty && (
                      <div className="p-4 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setAddItemDialogOpen(module.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Item Dialog */}
      <Dialog open={addItemDialogOpen !== null} onOpenChange={(open) => !open && setAddItemDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item to Module</DialogTitle>
            <DialogDescription>Add a new item to this module</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="item-title">Item Title</Label>
              <Input
                id="item-title"
                placeholder="e.g., Introduction Video"
                value={itemForm.title}
                onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item-type">Item Type</Label>
              <Select
                value={itemForm.type}
                onValueChange={(value) => setItemForm({ ...itemForm, type: value as ModuleItemType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAGE">Page</SelectItem>
                  <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                  <SelectItem value="QUIZ">Quiz</SelectItem>
                  <SelectItem value="FILE">File</SelectItem>
                  <SelectItem value="URL">URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(itemForm.type === "URL" || itemForm.type === "FILE") && (
              <div className="grid gap-2">
                <Label htmlFor="item-url">URL</Label>
                <Input
                  id="item-url"
                  placeholder="https://example.com"
                  value={itemForm.url || ""}
                  onChange={(e) => setItemForm({ ...itemForm, url: e.target.value })}
                />
              </div>
            )}
            {(itemForm.type === "ASSIGNMENT" || itemForm.type === "QUIZ") && (
              <div className="grid gap-2">
                <Label htmlFor="item-content-ref">Content Reference ID</Label>
                <Input
                  id="item-content-ref"
                  placeholder="Assignment or Quiz ID"
                  value={itemForm.contentRefId || ""}
                  onChange={(e) => setItemForm({ ...itemForm, contentRefId: e.target.value })}
                />
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Switch
                id="item-published"
                checked={itemForm.published}
                onCheckedChange={(checked) => setItemForm({ ...itemForm, published: checked })}
              />
              <Label htmlFor="item-published">Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemDialogOpen(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => addItemDialogOpen && handleCreateItem(addItemDialogOpen)}
              disabled={!itemForm.title.trim()}
            >
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseModulesNew;
