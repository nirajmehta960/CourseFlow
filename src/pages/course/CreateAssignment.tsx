import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { createAssignment, updateAssignment, getAssignment, Assignment } from "@/lib/assignments-api";
import { getErrorMessage } from "@/lib/api";

const CreateAssignment = () => {
  const navigate = useNavigate();
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId?: string }>();
  const isEditMode = !!assignmentId;
  const [loading, setLoading] = useState(isEditMode);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("100");
  const [assignmentGroup, setAssignmentGroup] = useState("assignments");
  const [displayGradeAs, setDisplayGradeAs] = useState("percentage");
  const [submissionType, setSubmissionType] = useState("online");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [dueTime, setDueTime] = useState("23:59");
  const [availableFrom, setAvailableFrom] = useState<Date | undefined>(undefined);
  const [availableFromTime, setAvailableFromTime] = useState("00:00");
  const [availableUntil, setAvailableUntil] = useState<Date | undefined>(undefined);
  const [availableUntilTime, setAvailableUntilTime] = useState("23:59");
  
  const [onlineEntryOptions, setOnlineEntryOptions] = useState({
    textEntry: false,
    websiteUrl: true,
    mediaRecordings: false,
    studentAnnotation: false,
    fileUploads: false,
  });

  // Fetch assignment data if in edit mode
  useEffect(() => {
    const fetchAssignment = async () => {
      if (!isEditMode || !courseId || !assignmentId) return;

      try {
        setLoading(true);
        const assignment = await getAssignment(courseId, assignmentId);
        
        // Pre-populate form fields
        setTitle(assignment.title || "");
        setDescription(assignment.description || "");
        setPoints(assignment.points?.toString() || "100");
        
        // Parse and set due date
        if (assignment.dueDate) {
          try {
            const dueDateObj = parseISO(assignment.dueDate);
            setDueDate(dueDateObj);
            // Extract time from ISO string
            const hours = dueDateObj.getHours().toString().padStart(2, "0");
            const minutes = dueDateObj.getMinutes().toString().padStart(2, "0");
            setDueTime(`${hours}:${minutes}`);
          } catch (error) {
            console.error("Failed to parse due date:", error);
          }
        }
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
  }, [isEditMode, courseId, assignmentId]);

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Assignment name is required",
        variant: "destructive",
      });
      return;
    }

    if (!courseId) {
      toast({
        title: "Error",
        description: "Course ID is missing",
        variant: "destructive",
      });
      return;
    }

    try {
      // Combine date and time into ISO string
      let dueDateISO: string | undefined = undefined;
      if (dueDate) {
        const [hours, minutes] = dueTime.split(":").map(Number);
        const dateTime = new Date(dueDate);
        dateTime.setHours(hours, minutes, 0, 0);
        dueDateISO = dateTime.toISOString();
      }

      const assignmentData = {
        title: title.trim(),
        description: description.trim() || undefined,
        points: parseFloat(points) || 0,
        dueDate: dueDateISO,
        published: publish,
      };

      if (isEditMode && assignmentId) {
        await updateAssignment(courseId, assignmentId, assignmentData);
        toast({
          title: "Assignment Updated",
          description: `"${title}" has been updated successfully.`,
        });
        navigate(`/courses/${courseId}/assignments/${assignmentId}`);
      } else {
        await createAssignment(courseId, assignmentData);
        toast({
          title: "Assignment Created",
          description: `"${title}" has been created successfully.`,
        });
        navigate(`/courses/${courseId}/assignments`);
      }
    } catch (error) {
      console.error("Failed to create assignment:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (isEditMode && assignmentId) {
      navigate(`/courses/${courseId}/assignments/${assignmentId}`);
    } else {
      navigate(`/courses/${courseId}/assignments`);
    }
  };

  // Generate time options in 15-minute intervals, plus 23:59
  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour = h.toString().padStart(2, "0");
      const minute = m.toString().padStart(2, "0");
      timeOptions.push(`${hour}:${minute}`);
    }
  }
  // Add 23:59 if not already present (the loop stops at 23:45)
  if (!timeOptions.includes("23:59")) {
    timeOptions.push("23:59");
  }

  if (loading) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading assignment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold text-foreground mb-8">
        {isEditMode ? "Edit Assignment" : "Create Assignment"}
      </h1>
      
      <div className="space-y-6">
        {/* Assignment Name */}
        <div className="space-y-2">
          <Label htmlFor="title">Assignment Name</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter assignment name"
            className="bg-muted/50"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter assignment description and instructions..."
            className="min-h-[120px] bg-muted/50"
          />
        </div>

        {/* Points */}
        <div className="grid grid-cols-[120px_1fr] items-center gap-4">
          <Label htmlFor="points" className="text-right">Points</Label>
          <Input
            id="points"
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="max-w-[200px] bg-muted/50"
          />
        </div>

        {/* Assignment Group */}
        <div className="grid grid-cols-[120px_1fr] items-center gap-4">
          <Label className="text-right">Assignment Group</Label>
          <Select value={assignmentGroup} onValueChange={setAssignmentGroup}>
            <SelectTrigger className="max-w-[300px] bg-muted/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="assignments">ASSIGNMENTS</SelectItem>
              <SelectItem value="quizzes">QUIZZES</SelectItem>
              <SelectItem value="exams">EXAMS</SelectItem>
              <SelectItem value="projects">PROJECTS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Display Grade as */}
        <div className="grid grid-cols-[120px_1fr] items-center gap-4">
          <Label className="text-right">Display Grade as</Label>
          <Select value={displayGradeAs} onValueChange={setDisplayGradeAs}>
            <SelectTrigger className="max-w-[300px] bg-muted/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="points">Points</SelectItem>
              <SelectItem value="letter">Letter Grade</SelectItem>
              <SelectItem value="complete">Complete/Incomplete</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submission Type */}
        <div className="grid grid-cols-[120px_1fr] items-center gap-4">
          <Label className="text-right">Submission Type</Label>
          <Select value={submissionType} onValueChange={setSubmissionType}>
            <SelectTrigger className="max-w-[300px] bg-muted/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="paper">On Paper</SelectItem>
              <SelectItem value="external">External Tool</SelectItem>
              <SelectItem value="none">No Submission</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Online Entry Options */}
        {submissionType === "online" && (
          <div className="grid grid-cols-[120px_1fr] gap-4">
            <div />
            <div className="space-y-3">
              <Label className="text-sm font-medium">Online Entry Options</Label>
              <div className="space-y-2">
                {[
                  { key: "textEntry", label: "Text Entry" },
                  { key: "websiteUrl", label: "Website URL" },
                  { key: "mediaRecordings", label: "Media Recordings" },
                  { key: "studentAnnotation", label: "Student Annotation" },
                  { key: "fileUploads", label: "File Uploads" },
                ].map((option) => (
                  <div key={option.key} className="flex items-center gap-2">
                    <Checkbox
                      id={option.key}
                      checked={onlineEntryOptions[option.key as keyof typeof onlineEntryOptions]}
                      onCheckedChange={(checked) =>
                        setOnlineEntryOptions((prev) => ({
                          ...prev,
                          [option.key]: checked,
                        }))
                      }
                    />
                    <Label htmlFor={option.key} className="text-sm font-normal text-muted-foreground">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Assign Section */}
        <div className="border-t pt-6 mt-6">
          <div className="grid grid-cols-[120px_1fr] gap-4 mb-4">
            <Label className="text-right font-medium">Assign</Label>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Assign to</Label>
                <Input value="Everyone" readOnly className="bg-muted/50" />
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className="grid grid-cols-[120px_1fr] gap-4 mb-4">
            <div />
            <div className="space-y-2">
              <Label className="text-sm">Due</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[200px] justify-start text-left font-normal bg-muted/50",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "MM/dd/yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <Select value={dueTime} onValueChange={setDueTime}>
                  <SelectTrigger className="w-[120px] bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Available From / Until */}
          <div className="grid grid-cols-[120px_1fr] gap-4">
            <div />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Available from</Label>
                <div className="flex flex-col gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-muted/50",
                          !availableFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {availableFrom ? format(availableFrom, "MM/dd/yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={availableFrom}
                        onSelect={setAvailableFrom}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <Select value={availableFromTime} onValueChange={setAvailableFromTime}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Until</Label>
                <div className="flex flex-col gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-muted/50",
                          !availableUntil && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {availableUntil ? format(availableUntil, "MM/dd/yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={availableUntil}
                        onSelect={setAvailableUntil}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <Select value={availableUntilTime} onValueChange={setAvailableUntilTime}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)}>
            Save
          </Button>
          <Button onClick={() => handleSave(true)}>
            Save & Publish
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateAssignment;
