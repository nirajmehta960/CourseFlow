import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileDown,
  Search,
  Edit,
  Save,
  X,
} from "lucide-react";
import {
  getGradebookView,
  overrideGrade,
  GradebookViewResponse,
  GradebookItem,
  StudentGradeRow,
  GradeOverrideRequest,
} from "@/lib/grades-api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useCoursePermissions } from "@/hooks/useCoursePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { getCourseById } from "@/lib/courses-api";
import { cn } from "@/lib/utils";

const CourseGradebook = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [gradebook, setGradebook] = useState<GradebookViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCell, setEditingCell] = useState<{
    studentId: string;
    itemId: string;
    itemType: string;
  } | null>(null);
  const [overrideValue, setOverrideValue] = useState<string>("");
  const { isInstructor: isFaculty } = useCoursePermissions();
  const { user } = useAuth();

  const [course, setCourse] = useState<any>(null); // Course info

  useEffect(() => {
    fetchGradebook();
    if (courseId) {
      getCourseById(courseId)
        .then(setCourse)
        .catch((error) => {
          console.error("Failed to fetch course:", error);
          toast({
            title: "Error",
            description: getErrorMessage(error),
            variant: "destructive",
          });
        });
    }
  }, [courseId]);

  const fetchGradebook = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      const data = await getGradebookView(courseId);
      setGradebook(data);
    } catch (error) {
      console.error("Failed to fetch gradebook:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (studentId: string, itemId: string, itemType: string, currentScore: number | null) => {
    if (!isFaculty) return;
    setEditingCell({ studentId, itemId, itemType });
    setOverrideValue(currentScore !== null ? currentScore.toString() : "");
  };

  const handleSaveOverride = async () => {
    if (!editingCell || !courseId) return;

    try {
      const request: GradeOverrideRequest = {
        courseId,
        studentId: editingCell.studentId,
        itemId: editingCell.itemId,
        itemType: editingCell.itemType as "ASSIGNMENT" | "QUIZ",
        overrideScore: overrideValue.trim() ? parseFloat(overrideValue) : null,
      };

      await overrideGrade(request);
      toast({
        title: "Success",
        description: "Grade overridden successfully",
      });
      setEditingCell(null);
      fetchGradebook();
    } catch (error) {
      console.error("Failed to override grade:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    if (!gradebook) return;

    // Build CSV content
    const courseTitle = course ? `${course.title} (${course.code}) - ${course.term}` : `Course ${courseId}`;
    const headers = ["Student Name", ...gradebook.items.map((item) => item.title), "Total Earned", "Total Possible", "Percent"];
    const rows: string[][] = [];

    gradebook.students.forEach((student) => {
      const row: string[] = [student.studentName || "Unknown Student"];
      gradebook.items.forEach((item) => {
        const grade = student.grades[item.itemId];
        if (grade && grade.score !== null) {
          row.push(grade.score.toString());
        } else {
          row.push("");
        }
      });
      row.push(student.totalEarned.toString());
      row.push(student.totalPossible.toString());
      row.push(student.percent.toFixed(2));
      rows.push(row);
    });

    // Convert to CSV
    const csvContent = [
      `"${courseTitle}"`,
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${courseTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_gradebook.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Gradebook exported to CSV",
    });
  };

  const filteredStudents = gradebook?.students.filter((student) =>
    student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full min-w-0 overflow-x-hidden">
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading gradebook...</p>
        </div>
      </div>
    );
  }

  if (!gradebook) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full min-w-0 overflow-x-hidden">
        <div className="text-center py-16">
          <p className="text-muted-foreground">No gradebook data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full min-w-0 overflow-x-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">Gradebook</h1>
          <p className="text-muted-foreground mt-1">View and manage student grades</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
          <Button onClick={handleExportCSV} variant="outline" className="w-full sm:w-auto">
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Gradebook Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="sticky left-0 z-10 bg-background min-w-[200px] font-semibold">
                    Student
                  </TableHead>
                  {gradebook.items.map((item) => (
                    <TableHead
                      key={item.itemId}
                      className="text-center font-semibold min-w-[120px]"
                    >
                      <div className="flex flex-col">
                        <span>{item.title}</span>
                        <span className="text-xs text-muted-foreground font-normal">
                          {item.points !== null ? `${item.points} pts` : "-"}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-semibold min-w-[100px]">Total</TableHead>
                  <TableHead className="text-center font-semibold min-w-[100px]">Percent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={gradebook.items.length + 3} className="text-center py-8">
                      <p className="text-muted-foreground">No students found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => {
                    return (
                      <TableRow key={student.studentId}>
                        <TableCell className="sticky left-0 z-10 bg-background font-medium p-0 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          <div className="flex flex-col h-full justify-center px-4 py-4 min-w-[200px]">
                            <span className="font-semibold">{student.studentName || "Unknown Student"}</span>
                          </div>
                        </TableCell>
                        {gradebook.items.map((item) => {
                          const grade = student.grades[item.itemId];
                          const score = grade?.score;
                          const status = grade?.status || "NOT_SUBMITTED";
                          const isGraded = status === "GRADED";

                          return (
                            <TableCell
                              key={item.itemId}
                              className={cn(
                                "text-center cursor-pointer hover:bg-muted/50 transition-colors",
                                isFaculty && "hover:bg-primary/5"
                              )}
                              onClick={() =>
                                isFaculty &&
                                handleCellClick(student.studentId, item.itemId, item.type, score || null)
                              }
                            >
                              {score !== null ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="font-semibold">{score}</span>
                                  {item.points !== null && (
                                    <span className="text-xs text-muted-foreground">
                                      / {item.points}
                                    </span>
                                  )}
                                  {status !== "GRADED" && (
                                    <Badge variant="secondary" className="text-xs">
                                      {status}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-semibold">
                          {student.totalEarned.toFixed(1)} / {student.totalPossible.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {student.percent.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Override Dialog */}
      <Dialog open={editingCell !== null} onOpenChange={(open) => !open && setEditingCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Grade</DialogTitle>
            <DialogDescription>
              Manually override the grade for this item. Leave empty to remove override.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Override Score</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={overrideValue}
                onChange={(e) => setOverrideValue(e.target.value)}
                placeholder="Enter override score or leave empty"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCell(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveOverride}>
              <Save className="h-4 w-4 mr-2" />
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseGradebook;
