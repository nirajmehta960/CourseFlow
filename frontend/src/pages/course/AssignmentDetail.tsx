import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, FileText, CheckCircle2, Download, Pencil } from "lucide-react";
import { getAssignment, Assignment } from "@/lib/assignments-api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { useCoursePermissions } from "@/hooks/useCoursePermissions";

const AssignmentDetail = () => {
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();
  const navigate = useNavigate();
  const { isInstructor } = useCoursePermissions();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!courseId || !assignmentId) return;

      try {
        setLoading(true);
        const data = await getAssignment(courseId, assignmentId);
        setAssignment(data);
      } catch (error) {
        console.error("Failed to fetch assignment:", error);
        toast({
          title: "Error",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [courseId, assignmentId]);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl">
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-8 max-w-6xl">
        <div className="text-center py-16">
          <p className="text-muted-foreground">Assignment not found</p>
          {courseId && (
            <Link to={`/courses/${courseId}/assignments`} className="mt-4 inline-block">
              <Button variant="outline">Back to Assignments</Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Format due date
  let dueDateStr = "No due date";
  if (assignment.dueDate) {
    try {
      dueDateStr = `Due ${format(parseISO(assignment.dueDate), "MMM d 'by' h:mma")}`;
    } catch {
      dueDateStr = "Invalid date";
    }
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          to={`/courses/${courseId}/assignments`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Assignments
        </Link>
      </div>

      <div className="flex gap-12">
        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              {assignment.title}
            </h1>
            <div className="flex gap-2">
              {isInstructor && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate(`/courses/${courseId}/assignments/${assignmentId}/edit`)}
                >
                  <Pencil className="h-4 w-4" />
                  Edit Assignment
                </Button>
              )}
              {!isInstructor && (
                <Button className="gap-2">
                  New Attempt
                </Button>
              )}
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-8 text-sm mb-8 flex-wrap">
            <div>
              <span className="text-muted-foreground">Due</span>{" "}
              <span className="font-medium text-foreground">{dueDateStr}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Points</span>{" "}
              <span className="font-medium text-foreground">{assignment.points}</span>
            </div>
          </div>

          <Separator className="mb-8" />

          {/* Description */}
          {assignment.description && (
            <div className="prose prose-sm max-w-none text-foreground">
              {assignment.description.split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-4 whitespace-pre-wrap">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
          {!assignment.description && (
            <p className="text-muted-foreground">No description provided.</p>
          )}
        </div>

        {/* Submission Sidebar - For now, show empty state as we don't have submission endpoint yet */}
        <div className="w-72 shrink-0">
          <div className="border border-border rounded-lg bg-background">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Submission</h2>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                No submission yet. Submit your assignment to see details here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;
