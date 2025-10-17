import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, FileText, CheckCircle2, Download } from "lucide-react";

const AssignmentDetail = () => {
  const { assignmentId } = useParams();

  // Mock data - in a real app this would come from an API
  const assignment = {
    id: assignmentId,
    title: "NoSQL Implementation",
    dueDate: "30 Nov by 23:59",
    points: 0,
    submittingType: "a text entry box or a file upload",
    fileTypes: "pdf and doc",
    description: `Please submit your project implementation in NoSQL (MongoDB or Neo4j). Here are the requirements for the submission:

1. Implementation in NoSQL, MongoDB or Neo4j. Using online playground is permitted. The implementation can use the same data and structure used in MySQL implementation and 3-5 collections and 5-10 records per collection should be sufficient.

2. At least 3 queries are created and tested.

3. Implementation details and query results should be included in the submission.

- Include the cover page (see project guideline).

- Follow the project guideline.`,
    submission: {
      status: "Submitted!",
      submittedAt: "29 Nov at 22:36",
      fileName: "NoSQLImplementation.pdf",
      grade: "Complete",
      pointsPossible: "0 pts possible",
      gradedAnonymously: false,
      comments: null,
    },
  };

  return (
    <div className="p-8 max-w-6xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          to="/courses/1/assignments"
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
            <Button className="gap-2">
              New Attempt
            </Button>
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-8 text-sm mb-8">
            <div>
              <span className="text-muted-foreground">Due</span>{" "}
              <span className="font-medium text-foreground">{assignment.dueDate}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Points</span>{" "}
              <span className="font-medium text-foreground">{assignment.points}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Submitting</span>{" "}
              <span className="font-medium text-foreground">{assignment.submittingType}</span>
            </div>
            <div>
              <span className="text-muted-foreground">File types</span>{" "}
              <span className="font-medium text-foreground">{assignment.fileTypes}</span>
            </div>
          </div>

          <Separator className="mb-8" />

          {/* Description */}
          <div className="prose prose-sm max-w-none text-foreground">
            {assignment.description.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Submission Sidebar */}
        <div className="w-72 shrink-0">
          <div className="border border-border rounded-lg bg-background">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Submission</h2>
            </div>

            <div className="p-4 space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">{assignment.submission.status}</span>
              </div>

              {/* Submitted Time */}
              <p className="text-sm text-muted-foreground">
                {assignment.submission.submittedAt}
              </p>

              {/* Links */}
              <div className="space-y-2">
                <button className="text-sm text-primary hover:underline block">
                  Submission details
                </button>
                <button className="text-sm text-primary hover:underline flex items-center gap-1">
                  <Download className="h-3.5 w-3.5" />
                  {assignment.submission.fileName}
                </button>
              </div>

              <Separator />

              {/* Grade */}
              <div>
                <p className="text-sm">
                  <span className="text-muted-foreground">Grade: </span>
                  <span className="font-medium text-foreground">{assignment.submission.grade}</span>
                  <span className="text-muted-foreground"> ({assignment.submission.pointsPossible})</span>
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Graded anonymously: {assignment.submission.gradedAnonymously ? "yes" : "no"}
                </p>
              </div>

              <Separator />

              {/* Comments */}
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Comments:</p>
                <p className="text-sm text-muted-foreground">
                  {assignment.submission.comments || "No comments"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;
