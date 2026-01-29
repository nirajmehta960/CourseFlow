import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { getCoursePeople } from "@/lib/courses-api";
import {
  getAssignment,
  getMySubmission,
  getSubmissions,
  submitAssignment,
  gradeSubmission,
  uploadFileToS3,
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
  const { isInstructor, loading: permissionsLoading } = useCoursePermissions();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isAttempting, setIsAttempting] = useState(false);

  // Submission form state
  const [bodyText, setBodyText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [fileInputs, setFileInputs] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});

  // Grading state
  const [pointsAwarded, setPointsAwarded] = useState<number | undefined>();
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!permissionsLoading) {
      fetchData();
    }
  }, [courseId, assignmentId, isInstructor, permissionsLoading]);

  const fetchData = async () => {
    if (!courseId || !assignmentId) return;

    try {
      setLoading(true);
      const [assignmentData, submissionData, submissionsData, peopleData] = await Promise.all([
        getAssignment(courseId, assignmentId),
        !isInstructor
          ? getMySubmission(courseId, assignmentId).catch((e) => {
            console.error("Failed to load your submission:", getErrorMessage(e));
            return null;
          })
          : Promise.resolve(null),
        isInstructor
          ? getSubmissions(courseId, assignmentId)
          : Promise.resolve([]),
        isInstructor
          ? getCoursePeople(courseId).catch(() => ({ people: [] }))
          : Promise.resolve({ people: [] }),
      ]);

      const people = peopleData?.people || [];
      const nameMap: Record<string, string> = {};
      people.forEach(p => {
        nameMap[p.userId] = p.name;
      });
      setStudentNames(nameMap);

      setAssignment(assignmentData);
      if (submissionData) {
        setMySubmission(submissionData);
        setBodyText(submissionData.bodyText || "");
        setUploadedFiles(submissionData.fileUrls || []);
      }
      setSubmissions(submissionsData);

      // Select first ungraded submission for instructors if none selected
      if (isInstructor && submissionsData.length > 0) {
        // If we already have a selection, try to maintain it with updated data
        if (selectedSubmission) {
          const updatedSelection = submissionsData.find(s => s.id === selectedSubmission.id);
          if (updatedSelection) {
            setSelectedSubmission(updatedSelection);
            setPointsAwarded(updatedSelection.grade?.pointsAwarded);
            setFeedback(updatedSelection.grade?.feedback || "");
            return;
          }
        }

        const ungraded = submissionsData.find(s => !s.grade);
        const toSelect = ungraded || submissionsData[0];
        setSelectedSubmission(toSelect);

        setPointsAwarded(toSelect.grade?.pointsAwarded);
        setFeedback(toSelect.grade?.feedback || "");
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

    setSubmitting(true);
    try {
      for (const file of files) {
        const response = await uploadFileToS3(file);
        setUploadedFiles(prev => [...prev, response.url]);
        setFileInputs(prev => [...prev, file]);
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
      toast({
        title: "Upload failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
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

      // Success actions
      setIsAttempting(false);
      fetchData();

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast({
        title: "Success",
        description: "Assignment submitted successfully",
      });
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
  const isExpired = assignment.availableUntil && isAfter(new Date(), parseISO(assignment.availableUntil));

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
        <Tabs defaultValue="overview" className="w-full space-y-6">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="submissions"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
            >
              Submissions
              <Badge variant="secondary" className="ml-2">{submissions.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
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
                  <span>{assignment.maxAttempts} attempts allowed</span>
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
          </TabsContent>

          <TabsContent value="submissions">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* List of Submissions */}
              <Card className="lg:col-span-1 h-[calc(100vh-250px)] flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-medium">Students</CardTitle>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={fetchData} title="Refresh Submissions">
                      <Clock className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={!selectedSubmission || submissions.findIndex(s => s.id === selectedSubmission.id) <= 0}
                      onClick={() => {
                        if (!selectedSubmission) return;
                        const idx = submissions.findIndex(s => s.id === selectedSubmission.id);
                        if (idx > 0) {
                          const prev = submissions[idx - 1];
                          setSelectedSubmission(prev);
                          setPointsAwarded(prev.grade?.pointsAwarded);
                          setFeedback(prev.grade?.feedback || "");
                        }
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={!selectedSubmission || submissions.findIndex(s => s.id === selectedSubmission.id) >= submissions.length - 1}
                      onClick={() => {
                        if (!selectedSubmission) return;
                        const idx = submissions.findIndex(s => s.id === selectedSubmission.id);
                        if (idx < submissions.length - 1) {
                          const next = submissions[idx + 1];
                          setSelectedSubmission(next);
                          setPointsAwarded(next.grade?.pointsAwarded);
                          setFeedback(next.grade?.feedback || "");
                        }
                      }}
                    >
                      <ChevronLeft className="h-4 w-4 rotate-180" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto">
                  {submissions.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      No submissions yet.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {submissions.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setPointsAwarded(sub.grade?.pointsAwarded);
                            setFeedback(sub.grade?.feedback || "");
                          }}
                          className={`w-full text-left p-4 transition-colors hover:bg-muted/50 ${selectedSubmission?.id === sub.id
                            ? "bg-muted border-l-4 border-l-primary"
                            : "border-l-4 border-l-transparent"
                            }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{studentNames[sub.studentId] || sub.studentId}</span>
                            {sub.grade ? (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                {sub.grade.pointsAwarded} / {assignment.points}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Needed
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{sub.fileUrls.length} file{sub.fileUrls.length !== 1 && 's'}</span>
                            <span>•</span>
                            <span>{sub.submittedAt ? format(parseISO(sub.submittedAt), "MMM d") : "Draft"}</span>
                          </div>
                          {/* File Links Preview in List */}
                          {sub.fileUrls.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {sub.fileUrls.map((url, i) => (
                                <div key={i} className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                  <File className="h-3 w-3" />
                                  <span className="truncate max-w-[100px]">File {i + 1}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Detail View */}
              <div className="lg:col-span-2 space-y-6">
                {selectedSubmission ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Submission Details</span>
                          <span className="text-sm font-normal text-muted-foreground">
                            Submitted: {selectedSubmission.submittedAt ? format(parseISO(selectedSubmission.submittedAt), "PPP p") : "Not submitted"}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Student</Label>
                          <p className="font-medium">{studentNames[selectedSubmission.studentId] || selectedSubmission.studentId}</p>
                        </div>

                        {selectedSubmission.bodyText && (
                          <div>
                            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Text Entry</Label>
                            <div className="mt-2 p-4 bg-muted/30 rounded-lg whitespace-pre-wrap text-sm border">
                              {selectedSubmission.bodyText}
                            </div>
                          </div>
                        )}

                        <div>
                          <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">Attached Files</Label>
                          {selectedSubmission.fileUrls.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {selectedSubmission.fileUrls.map((url, index) => (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                                >
                                  <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
                                    <File className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-blue-600 group-hover:underline truncate">File {index + 1}</p>
                                    <p className="text-xs text-muted-foreground">Click to view</p>
                                  </div>
                                  <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No files attached.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Grading</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="points">Points Awarded</Label>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Input
                                id="points"
                                type="number"
                                min="0"
                                max={assignment.points}
                                value={pointsAwarded ?? ""}
                                onChange={(e) => setPointsAwarded(e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="text-lg font-medium"
                              />
                              <span className="text-muted-foreground font-medium">/ {assignment.points}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="feedback">Feedback Comments</Label>
                          <Textarea
                            id="feedback"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={4}
                            placeholder="Enter feedback for the student..."
                            className="mt-1.5"
                          />
                        </div>
                        <div className="flex justify-end pt-2">
                          <Button
                            onClick={handleGrade}
                            disabled={submitting}
                            className="min-w-[120px]"
                          >
                            {submitting ? "Saving..." : "Post Grade"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center p-12 border-2 border-dashed rounded-xl bg-muted/10">
                    <div className="text-center">
                      <User className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                      <h3 className="font-medium text-lg">No Submission Selected</h3>
                      <p className="text-muted-foreground">Select a student from the list to view and grade their submission.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        // Student View
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col gap-4 border-b pb-6">
            <div className="flex items-start justify-between">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{assignment.title}</h1>
              {isAvailable && !isExpired && !submitting && !isAttempting && (
                <>
                  {(!mySubmission || (mySubmission.attemptNumber || 0) < (assignment.maxAttempts || 3)) ? (
                    <Button
                      size="lg"
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                      onClick={() => {
                        setIsAttempting(true);
                        // Clear form for new attempt
                        setUploadedFiles([]);
                        setBodyText("");
                        setFileInputs([]);
                      }}
                    >
                      {mySubmission ? "New Attempt" : "Start Assignment"}
                    </Button>
                  ) : (
                    <div className="flex flex-col items-end">
                      <Button disabled size="lg" variant="secondary">
                        Attempts Exhausted
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">Due</span>
                {dueDate ? format(dueDate, "EEEE 'by' h:mma") : "No Due Date"}
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">Points</span>
                {assignment.points}
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">Attempts</span>
                <span>{mySubmission?.attemptNumber || 0} / {assignment.maxAttempts || 3}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">Submitting</span>
                <span>a text entry box, a website url, or a file upload</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {!isAttempting && (
                <div className="space-y-6">
                  {/* Description */}
                  {assignment.description && (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div dangerouslySetInnerHTML={{ __html: assignment.description }} />
                    </div>
                  )}
                </div>
              )}

              {/* Submission Form */}
              {isAttempting && (
                <Card className="border-2 border-muted/50">
                  <CardHeader className="bg-muted/50 border-b pb-4">
                    <CardTitle className="text-lg">File Upload</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <Tabs defaultValue="file" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 lg:w-[400px] mb-6">
                        <TabsTrigger value="file">File Upload</TabsTrigger>
                        <TabsTrigger value="text">Text Entry</TabsTrigger>
                        <TabsTrigger value="url">Website URL</TabsTrigger>
                      </TabsList>

                      <TabsContent value="file" className="space-y-6">
                        <div
                          className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-10 text-center hover:bg-muted/5 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="flex flex-col items-center gap-4 cursor-pointer">
                            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                              <Upload className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium text-lg">Drag a file here, or</p>
                              <p className="text-sm text-muted-foreground">Choose a file to upload</p>
                            </div>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </div>

                        {uploadedFiles.length > 0 && (
                          <div className="space-y-2">
                            {uploadedFiles.map((url, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg border">
                                <div className="flex items-center gap-3">
                                  <File className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-medium">{fileInputs[index]?.name || `File ${index + 1}`}</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeFile(index)} className="h-8 w-8 text-red-500">
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="text">
                        <Textarea
                          value={bodyText}
                          onChange={(e) => setBodyText(e.target.value)}
                          rows={12}
                          placeholder="Type your submission here..."
                          className="resize-y min-h-[200px]"
                        />
                      </TabsContent>

                      <TabsContent value="url">
                        <div className="space-y-2">
                          <Label>Website URL</Label>
                          <Input placeholder="https://example.com/my-assignment" />
                          <p className="text-xs text-muted-foreground">Enter the URL of your assignment (e.g. GitHub repo, Google Doc).</p>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                      <Button variant="outline" onClick={() => setIsAttempting(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        className="bg-red-600 hover:bg-red-700 text-white min-w-[140px]"
                        disabled={submitting || (uploadedFiles.length === 0 && !bodyText)}
                      >
                        {submitting ? "Submitting..." : "Submit Assignment"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar (Submission Status) */}
            <div className="space-y-6">
              {!isAttempting && mySubmission && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Submission</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Submitted!</span>
                      </div>
                      {mySubmission.submittedAt && (
                        <span className="text-sm text-muted-foreground">
                          {format(parseISO(mySubmission.submittedAt), "MMM d 'at' h:mma a")}
                        </span>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <p className="text-sm font-medium">Submission Details</p>
                      {mySubmission.fileUrls?.length > 0 && (
                        <div className="space-y-2">
                          {mySubmission.fileUrls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                              <File className="h-3 w-3" />
                              View File {i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {mySubmission.grade && (
                      <>
                        <Separator />
                        <div className="bg-muted p-3 rounded-md">
                          <p className="font-semibold text-sm">Grade</p>
                          <p className="text-lg">{mySubmission.grade.pointsAwarded} / {assignment.points}</p>
                          {mySubmission.grade.feedback && (
                            <div className="mt-2 text-sm text-muted-foreground border-t pt-2 border-border/50">
                              <p className="font-medium text-xs uppercase tracking-wider mb-1">Feedback</p>
                              {mySubmission.grade.feedback}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )
      }
    </div >
  );
};

export default AssignmentDetailNew;
