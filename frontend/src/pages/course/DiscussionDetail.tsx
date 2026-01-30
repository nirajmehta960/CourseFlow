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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Reply, Edit, Trash2, Send, Search, Filter } from "lucide-react";
import { getInitials } from "@/lib/utils";
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
import { format, parseISO, formatDistanceToNow } from "date-fns";
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
    const authorName = post.authorName || "Unknown User";
    const initials = getInitials(authorName);

    return (
      <div key={post.id} className={isReply ? "ml-12 mt-6 border-l-2 border-border pl-4" : "mt-8"}>
        <div className="flex gap-4">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarFallback className="bg-background text-foreground font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Header: Name and Date */}
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-blue-600 hover:underline cursor-pointer">
                  {authorName}
                </span>
                {post.userId === user?.id && <Badge variant="secondary" className="text-[10px] px-1 h-4">You</Badge>}
                <span className="text-xs text-muted-foreground">
                  {post.createdAt
                    ? format(parseISO(post.createdAt), "MMM d, yyyy 'at' h:mm a")
                    : "Unknown date"}
                </span>
              </div>

              <div className="flex items-center">
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(post)}>
                      <Edit className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(post.id)}>
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div
              className="mt-2 text-sm text-foreground prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
            />

            {/* Actions */}
            <div className="mt-3 flex items-center gap-4 text-xs font-medium text-muted-foreground">
              {!isReply && (
                <button
                  onClick={() => handleReply(post)}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Reply className="h-3 w-3" />
                  Reply
                </button>
              )}
              {/* Mock buttons for visual matching */}
              <button className="hover:text-foreground transition-colors">Like</button>
              {isFaculty && <button className="text-green-600 hover:text-green-700">Mark as correct</button>}
            </div>
          </div>
        </div>

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
    <div className="p-6 md:p-8 w-full min-w-0 overflow-x-hidden bg-background min-h-screen">
      {/* Header / Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(`/courses/${courseId}/discussions`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Discussions
          </Button>
          <span>/</span>
          <span className="truncate max-w-[200px]">{discussion.title}</span>
        </div>
      </div>

      {/* Main Topic Section (Canvas Style) */}
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-normal text-foreground mb-4">{discussion.title}</h1>

        <div className="text-sm text-muted-foreground mb-4">
          {discussion.createdAt ? `Published on ${format(parseISO(discussion.createdAt), "MMMM d, yyyy")}` : ""}
        </div>

        <div className="prose prose-sm max-w-none mb-6 text-foreground">
          <div dangerouslySetInnerHTML={{ __html: discussion.bodyHtml }} />
        </div>

        <Button
          onClick={() => handleReply(null)}
          className="bg-red-600 hover:bg-red-700 text-white rounded-sm px-4 py-1 h-9 font-medium"
        >
          <Reply className="h-4 w-4 mr-2" />
          Reply
        </Button>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6 bg-muted/30 p-2 rounded-sm border border-border/50">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search entries or author..."
            className="w-full h-9 pl-9 pr-4 rounded-sm border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="h-9 font-normal text-xs bg-background">
            <Filter className="h-3 w-3 mr-2" />
            Unread
          </Button>
          <Button variant="outline" size="sm" className="h-9 font-normal text-xs bg-background min-w-[100px] justify-between">
            Newest First
            <ArrowLeft className="h-3 w-3 rotate-90 ml-2" />
          </Button>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-6">
        {discussion.posts && discussion.posts.length > 0 ? (
          discussion.posts.map((post) => renderPost(post))
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-muted/10">
            <p className="text-muted-foreground">No replies yet. Be the first to reply!</p>
          </div>
        )}
      </div>

      {/* Dialogs remain the same (rendered via state) */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {replyingTo ? "Reply to Post" : "Reply to Discussion"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reply-body" className="sr-only">Reply Body</Label>
            <Textarea
              id="reply-body"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write your reply..."
              rows={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitReply}>Post Reply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-body" className="sr-only">Access Body</Label>
            <Textarea
              id="edit-body"
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdatePost}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscussionDetail;
