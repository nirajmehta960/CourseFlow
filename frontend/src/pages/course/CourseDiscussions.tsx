import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MessageSquare, Edit, Trash2 } from "lucide-react";
import {
  getDiscussions,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  Discussion,
  DiscussionRequest,
} from "@/lib/discussions-api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { useCoursePermissions } from "@/hooks/useCoursePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState";

const CourseDiscussions = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDiscussion, setEditingDiscussion] = useState<Discussion | null>(null);
  const [formData, setFormData] = useState<DiscussionRequest>({
    title: "",
    bodyHtml: "",
    published: false,
  });
  const { isInstructor: isFaculty } = useCoursePermissions();
  const { user } = useAuth();

  useEffect(() => {
    fetchDiscussions();
  }, [courseId]);

  const fetchDiscussions = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      const data = await getDiscussions(courseId, isFaculty || false);
      setDiscussions(data);
    } catch (error) {
      console.error("Failed to fetch discussions:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!courseId) return;

    try {
      await createDiscussion(courseId, formData);
      toast({
        title: "Success",
        description: "Discussion created successfully",
      });
      setIsCreateDialogOpen(false);
      setFormData({ title: "", bodyHtml: "", published: false });
      fetchDiscussions();
    } catch (error) {
      console.error("Failed to create discussion:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleEdit = (discussion: Discussion) => {
    setEditingDiscussion(discussion);
    setFormData({
      title: discussion.title,
      bodyHtml: discussion.bodyHtml,
      published: discussion.published,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!courseId || !editingDiscussion) return;

    try {
      await updateDiscussion(courseId, editingDiscussion.id, formData);
      toast({
        title: "Success",
        description: "Discussion updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingDiscussion(null);
      setFormData({ title: "", bodyHtml: "", published: false });
      fetchDiscussions();
    } catch (error) {
      console.error("Failed to update discussion:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (discussionId: string) => {
    if (!courseId) return;

    if (!confirm("Are you sure you want to delete this discussion?")) {
      return;
    }

    try {
      await deleteDiscussion(courseId, discussionId);
      toast({
        title: "Success",
        description: "Discussion deleted successfully",
      });
      fetchDiscussions();
    } catch (error) {
      console.error("Failed to delete discussion:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full min-w-0 overflow-x-hidden">
        <div className="mb-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40 ml-auto" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">Discussions</h1>
          <p className="text-muted-foreground mt-1">Course discussions and Q&A</p>
        </div>
        {isFaculty && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Discussion
          </Button>
        )}
      </div>

      {/* Discussions List */}
      {discussions.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-12 w-12" />}
          title="No discussions yet"
          description={
            isFaculty
              ? "Create your first discussion to engage with students."
              : "This course doesn't have any discussions yet."
          }
          action={
            isFaculty
              ? {
                  label: "Create Discussion",
                  onClick: () => setIsCreateDialogOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {discussions.map((discussion) => (
            <Card key={discussion.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">
                        <Link
                          to={`/courses/${courseId}/discussions/${discussion.id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {discussion.title}
                        </Link>
                      </CardTitle>
                      {!discussion.published && (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </div>
                    <div
                      className="text-sm text-muted-foreground line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: discussion.bodyHtml }}
                    />
                  </div>
                  {isFaculty && (
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(discussion)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(discussion.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    {discussion.postCount || 0} {discussion.postCount === 1 ? "reply" : "replies"}
                  </span>
                  <span>•</span>
                  <span>
                    {discussion.createdAt
                      ? format(parseISO(discussion.createdAt), "MMM d, yyyy 'at' h:mm a")
                      : "Unknown date"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Discussion</DialogTitle>
            <DialogDescription>
              Create a new discussion topic for this course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Discussion title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bodyHtml">Body</Label>
              <Textarea
                id="bodyHtml"
                value={formData.bodyHtml}
                onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
                placeholder="Discussion content (HTML supported)"
                rows={6}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, published: checked })
                }
              />
              <Label htmlFor="published">Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Discussion</DialogTitle>
            <DialogDescription>Update the discussion details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Discussion title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-bodyHtml">Body</Label>
              <Textarea
                id="edit-bodyHtml"
                value={formData.bodyHtml}
                onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
                placeholder="Discussion content (HTML supported)"
                rows={6}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-published"
                checked={formData.published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, published: checked })
                }
              />
              <Label htmlFor="edit-published">Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseDiscussions;
