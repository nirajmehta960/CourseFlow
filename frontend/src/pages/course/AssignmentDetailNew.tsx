import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  FileText,
  CheckCircle2,
  Upload,
  X,
  Download,
  Pencil,
  Clock,
  User,
  File,
  Send,
  Save,
} from "lucide-react";
import {
  getAssignment,
  getMySubmission,
  getSubmissions,
  submitAssignment,
  gradeSubmission,
  uploadFile,
  Assignment,
  Submission,
  SubmissionRequest,
} from "@/lib/assignments-api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { format, parseISO, isAfter } from "date-fns";
import { useCoursePermissions } from "@/hooks/useCoursePermissions";
import { useAuth } from "@/contexts/AuthContext";

const AssignmentDetailNew = () => {
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();
  const navigate = useNavigate();
  const { isInstructor } = useCoursePermissions();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Submission form state
  const [bodyText, setBodyText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [fileInputs, setFileInputs] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Grading state
  const [pointsAwarded, setPointsAwarded] = useState<number | undefined>();
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetchData();
  }, [courseId, assignmentId]);

  const fetchData = async () => {
    if (!courseId || !assignmentId) return;

    try {
      setLoading(true);
      const [assignmentData, submissionData, submissionsData] = await Promise.all([
        getAssignment(courseId, assignmentId),
        !isInstructor
          ? getMySubmission(courseId, assignmentId).catch((e) => {
              console.error("Failed to load your submission:", getErrorMessage(e));
              return null;
            })
          : Promise.resolve(null),
        isInstructor
          ? getSubmissions(courseId, assignmentId).catch((e) => {
              console.error("Failed to load submissions:", getErrorMessage(e));
              return [];
            })
          : Promise.resolve([]),
      ]);

      setAssignment(assignmentData);
      if (submissionData) {
        setMySubmission(submissionData);
        setBodyText(submissionData.bodyText || "");
        setUploadedFiles(submissionData.fileUrls || []);
      }
      setSubmissions(submissionsData);

      // Select first ungraded submission for instructors
      if (isInstructor && submissionsData.length > 0) {
        const ungraded = submissionsData.find(s => !s.grade);
        setSelectedSubmission(ungraded || submissionsData[0]);
        if (ungraded) {
          setPointsAwarded(undefined);
          setFeedback("");
        } else {
          setPointsAwarded(ungraded?.grade?.pointsAwarded);
          setFeedback(ungraded?.grade?.feedback || "");
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file sizes (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    const oversized = files.filter(f => f.size > maxSize);
    if (oversized.length > 0) {
      toast({
        title: "File too large",
        description: "Files must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    // Convert files to base64
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        try {
          const response = await uploadFile({
            fileName: file.name,
            base64Data: base64,
          });
          setUploadedFiles(prev => [...prev, response.url]);
          setFileInputs(prev => [...prev, file]);
        } catch (error) {
          console.error("Failed to upload file:", error);
          toast({
            title: "Upload failed",
            description: getErrorMessage(error),
            variant: "destructive",
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setFileInputs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    if (!courseId || !assignmentId) return;

    try {
      setSubmitting(true);
      const request: SubmissionRequest = {
        status: "DRAFT",
        bodyText,
        fileUrls: uploadedFiles,
      };
      await submitAssignment(courseId, assignmentId, request);
      toast({
        title: "Success",
        description: "Draft saved",
      });
      fetchData();
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!courseId || !assignmentId) return;

    try {
      setSubmitting(true);
      const request: SubmissionRequest = {
        status: "SUBMITTED",
        bodyText,
        fileUrls: uploadedFiles,
      };
      await submitAssignment(courseId, assignmentId, request);
      toast({
        title: "Success",
        description: "Assignment submitted successfully",
      });
      fetchData();
    } catch (error) {
      console.error("Failed to submit:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrade = async () => {
    if (!courseId || !assignmentId || !selectedSubmission) return;

    try {
      setSubmitting(true);
      await gradeSubmission(courseId, assignmentId, selectedSubmission.id, {
        pointsAwarded,
        feedback,
      });
      toast({
        title: "Success",
        description: "Submission graded successfully",
      });
      fetchData();
    } catch (error) {
      console.error("Failed to grade:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="text-center py-16">
          <p className="text-muted-foreground">Assignment not found</p>
        </div>
      </div>
    );
  }

  // const courseId = assignment.courseId; // Removed duplicate declaration
  const dueDate = assignment.dueAt ? parseISO(assignment.dueAt) : null;
  const isPastDue = dueDate && !isAfter(dueDate, new Date());
  const isAvailable = !assignment.availableFrom || isAfter(new Date(), parseISO(assignment.availableFrom));
  const isExpired = assignment.availableUntil && !isAfter(new Date(), parseISO(assignment.availableUntil));

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
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

      {isInstructor ? (
        // Instructor SpeedGrader View
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Assignment Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{assignment.title}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => navigate(`/courses/${courseId}/assignments/${assignmentId}/edit`)}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <span>{assignment.points} points</span>
                  {dueDate && (
                    <span>Due {format(dueDate, "MMM d, yyyy 'at' h:mma")}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {assignment.description && (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: assignment.description }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Selected Submission */}
            {selectedSubmission && (
              <Card>
                <CardHeader>
                  <CardTitle>Submission</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Student</Label>
                    <p className="text-sm text-muted-foreground">{selectedSubmission.studentId}</p>
                  </div>
                  {selectedSubmission.bodyText && (
                    <div>
                      <Label>Text Response</Label>
                      <div className="mt-2 p-4 bg-muted rounded-lg whitespace-pre-wrap">
                        {selectedSubmission.bodyText}
                      </div>
                    </div>
                  )}
                  {selectedSubmission.fileUrls.length > 0 && (
                    <div>
                      <Label>Files</Label>
                      <div className="mt-2 space-y-2">
                        {selectedSubmission.fileUrls.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <File className="h-4 w-4" />
                            File {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedSubmission.submittedAt && (
                    <div>
                      <Label>Submitted</Label>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(selectedSubmission.submittedAt), "MMM d, yyyy 'at' h:mma")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Submissions List & Grading */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submissions ({submissions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {submissions.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setSelectedSubmission(sub);
                        setPointsAwarded(sub.grade?.pointsAwarded);
                        setFeedback(sub.grade?.feedback || "");
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedSubmission?.id === sub.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{sub.studentId}</span>
                        {sub.grade ? (
                          <Badge variant="default">
                            {sub.grade.pointsAwarded} / {assignment.points}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Ungraded</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedSubmission && (
              <Card>
                <CardHeader>
                  <CardTitle>Grade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="points">Points (out of {assignment.points})</Label>
                    <Input
                      id="points"
                      type="number"
                      min="0"
                      max={assignment.points}
                      value={pointsAwarded ?? ""}
                      onChange={(e) => setPointsAwarded(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="feedback">Feedback</Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <Button
                    onClick={handleGrade}
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting ? "Grading..." : "Submit Grade"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        // Student View
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{assignment.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <span>{assignment.points} points</span>
                  {dueDate && (
                    <span className={isPastDue ? "text-destructive" : ""}>
                      Due {format(dueDate, "MMM d, yyyy 'at' h:mma")}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {assignment.description && (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: assignment.description }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Submission Form */}
            {isAvailable && !isExpired && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Submission</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="bodyText">Text Response</Label>
                    <Textarea
                      id="bodyText"
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      rows={10}
                      placeholder="Enter your response here..."
                    />
                  </div>

                  <div>
                    <Label>Files</Label>
                    <div className="mt-2 space-y-2">
                      {uploadedFiles.map((url, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4" />
                            <span className="text-sm">{fileInputs[index]?.name || `File ${index + 1}`}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={submitting}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Draft
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || (!bodyText.trim() && uploadedFiles.length === 0)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {submitting ? "Submitting..." : "Submit Assignment"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Submission Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mySubmission ? (
                  <>
                    <div>
                      <Label>Status</Label>
                      <Badge variant={mySubmission.status === "SUBMITTED" ? "default" : "secondary"}>
                        {mySubmission.status}
                      </Badge>
                    </div>
                    {mySubmission.submittedAt && (
                      <div>
                        <Label>Submitted</Label>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(mySubmission.submittedAt), "MMM d, yyyy 'at' h:mma")}
                        </p>
                      </div>
                    )}
                    {mySubmission.grade && (
                      <>
                        <Separator />
                        <div>
                          <Label>Grade</Label>
                          <p className="text-2xl font-bold">
                            {mySubmission.grade.pointsAwarded} / {assignment.points}
                          </p>
                        </div>
                        {mySubmission.grade.feedback && (
                          <div>
                            <Label>Feedback</Label>
                            <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
                              {mySubmission.grade.feedback}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No submission yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentDetailNew;
