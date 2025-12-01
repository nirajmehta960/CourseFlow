import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Reply, Edit, Trash2, Send } from "lucide-react";
import {
  getDiscussion,
  createPost,
  updatePost,
  deletePost,
  Discussion,
  Post,
  PostRequest,
} from "@/lib/discussions-api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { useCoursePermissions } from "@/hooks/useCoursePermissions";
import { useAuth } from "@/contexts/AuthContext";

const DiscussionDetail = () => {
  const { courseId, discussionId } = useParams<{ courseId: string; discussionId: string }>();
  const navigate = useNavigate();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [editBody, setEditBody] = useState("");
  const { isInstructor: isFaculty } = useCoursePermissions();
  const { user } = useAuth();

  useEffect(() => {
    fetchDiscussion();
  }, [courseId, discussionId]);

  const fetchDiscussion = async () => {
    if (!courseId || !discussionId) return;

    try {
      setLoading(true);
      const data = await getDiscussion(courseId, discussionId);
      setDiscussion(data);
    } catch (error) {
      console.error("Failed to fetch discussion:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReply = (post: Post | null = null) => {
    setReplyingTo(post);
    setReplyBody("");
    setIsReplyDialogOpen(true);
  };

  const handleSubmitReply = async () => {
    if (!courseId || !discussionId || !replyBody.trim()) return;

    try {
      const request: PostRequest = {
        bodyHtml: replyBody,
        parentPostId: replyingTo?.id || null,
      };
      await createPost(courseId, discussionId, request);
      toast({
        title: "Success",
        description: "Reply posted successfully",
      });
      setIsReplyDialogOpen(false);
      setReplyingTo(null);
      setReplyBody("");
      fetchDiscussion();
    } catch (error) {
      console.error("Failed to post reply:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setEditBody(post.bodyHtml);
    setIsEditDialogOpen(true);
  };

  const handleUpdatePost = async () => {
    if (!courseId || !editingPost || !editBody.trim()) return;

    try {
      const request: PostRequest = {
        bodyHtml: editBody,
        parentPostId: editingPost.parentPostId || null,
      };
      await updatePost(courseId, editingPost.id, request);
      toast({
        title: "Success",
        description: "Post updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingPost(null);
      setEditBody("");
      fetchDiscussion();
    } catch (error) {
      console.error("Failed to update post:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (postId: string) => {
    if (!courseId) return;

    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await deletePost(courseId, postId);
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
      fetchDiscussion();
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const canEditPost = (post: Post) => {
    return post.userId === user?.id || isFaculty;
  };

  const renderPost = (post: Post, isReply: boolean = false) => {
    const canEdit = canEditPost(post);

    return (
      <div key={post.id} className={isReply ? "ml-8 mt-4" : "mt-4"}>
        <Card className={isReply ? "border-l-4 border-primary/20" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-sm">
                    {post.userId === user?.id ? "You" : `User ${post.userId.substring(0, 8)}`}
                  </span>
                  {isReply && (
                    <Badge variant="outline" className="text-xs">
                      Reply
                    </Badge>
                  )}
                </div>
                <div
                  className="text-sm text-foreground"
                  dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
                />
              </div>
              {canEdit && (
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(post)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(post.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {post.createdAt
                  ? format(parseISO(post.createdAt), "MMM d, yyyy 'at' h:mm a")
                  : "Unknown date"}
              </span>
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReply(post)}
                  className="text-xs"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Render nested replies */}
        {post.replies && post.replies.length > 0 && (
          <div className="mt-2">
            {post.replies.map((reply) => renderPost(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full min-w-0 overflow-x-hidden">
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading discussion...</p>
        </div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full min-w-0 overflow-x-hidden">
        <div className="text-center py-16">
          <p className="text-muted-foreground">Discussion not found</p>
          <Button
            variant="outline"
            onClick={() => navigate(`/courses/${courseId}/discussions`)}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Discussions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/courses/${courseId}/discussions`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Discussions
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">
              {discussion.title}
            </h1>
            <p className="text-muted-foreground mt-1">
              {discussion.postCount || 0} {discussion.postCount === 1 ? "reply" : "replies"}
            </p>
          </div>
          <Button onClick={() => handleReply(null)}>
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </Button>
        </div>
      </div>

      {/* Discussion Body */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">
              {discussion.createdBy === user?.id
                ? "You"
                : `User ${discussion.createdBy?.substring(0, 8) || "Unknown"}`}
            </span>
            <span className="text-xs text-muted-foreground">
              {discussion.createdAt
                ? format(parseISO(discussion.createdAt), "MMM d, yyyy 'at' h:mm a")
                : "Unknown date"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: discussion.bodyHtml }}
          />
        </CardContent>
      </Card>

      {/* Posts */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          {discussion.posts && discussion.posts.length > 0
            ? `${discussion.posts.length} ${discussion.posts.length === 1 ? "Reply" : "Replies"}`
            : "No replies yet"}
        </h2>
        {discussion.posts && discussion.posts.length > 0 ? (
          discussion.posts.map((post) => renderPost(post))
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Be the first to reply!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {replyingTo ? "Reply to Post" : "Post a Reply"}
            </DialogTitle>
            <DialogDescription>
              {replyingTo
                ? "Your reply will be nested under the selected post."
                : "Add a reply to this discussion."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="reply-body">Your Reply</Label>
              <Textarea
                id="reply-body"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Enter your reply (HTML supported)"
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReply}>
              <Send className="h-4 w-4 mr-2" />
              Post Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>Update your post content.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-body">Post Content</Label>
              <Textarea
                id="edit-body"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                placeholder="Enter post content (HTML supported)"
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePost}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscussionDetail;
