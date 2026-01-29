import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, X, Paperclip, File, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Course, getCoursePeople } from "@/lib/courses-api";
import { createConversation, sendMessage, Attachment } from "@/lib/inbox-api";
import { uploadFileToS3 } from "@/lib/assignments-api";

interface ComposeMessageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    courses: Course[];
    onMessageSent: (conversationId?: string) => void;
}

interface Recipient {
    id: string;
    name: string;
    role: string;
}

export function ComposeMessageDialog({
    open,
    onOpenChange,
    courses,
    onMessageSent,
}: ComposeMessageDialogProps) {
    const { toast } = useToast();
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isLoadingPeople, setIsLoadingPeople] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [recipientOpen, setRecipientOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (!open) {
            setSelectedCourseId("");
            setRecipients([]);
            setSelectedRecipientIds([]);
            setSubject("");
            setBody("");
            setAttachments([]);
        }
    }, [open]);

    // Fetch people when course changes
    useEffect(() => {
        if (!selectedCourseId) {
            setRecipients([]);
            setSelectedRecipientIds([]);
            return;
        }

        const fetchPeople = async () => {
            setIsLoadingPeople(true);
            try {
                const response = await getCoursePeople(selectedCourseId);
                // Map backend response to simple Recipient objects
                const peopleList = response.people.map((p) => ({
                    id: p.userId,
                    name: p.name || "Unknown",
                    role: p.courseRole,
                }));
                setRecipients(peopleList);
            } catch (error) {
                console.error("Failed to fetch course people:", error);
                toast({
                    title: "Error",
                    description: "Failed to load recipients for this course.",
                    variant: "destructive",
                });
            } finally {
                setIsLoadingPeople(false);
            }
        };

        fetchPeople();
    }, [selectedCourseId, toast]);

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

        setIsUploading(true);
        try {
            for (const file of files) {
                const response = await uploadFileToS3(file);

                const newAttachment: Attachment = {
                    id: crypto.randomUUID(),
                    fileName: response.fileName,
                    url: response.url,
                    contentType: file.type,
                    size: response.fileSize
                };

                setAttachments(prev => [...prev, newAttachment]);
            }
        } catch (error) {
            console.error("Failed to upload file:", error);
            toast({
                title: "Upload failed",
                description: "Failed to upload one or more files.",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        if (!selectedCourseId || selectedRecipientIds.length === 0 || (!body.trim() && attachments.length === 0)) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields.",
                variant: "destructive",
            });
            return;
        }

        setIsSending(true);
        try {
            // 1. Create Conversation (Thread)
            const newConversation = await createConversation({
                courseId: selectedCourseId,
                participantIds: selectedRecipientIds,
                title: subject || "No Subject",
            });

            // 2. Send Message body
            await sendMessage(newConversation.id, {
                body: body || (attachments.length > 0 ? "Sent attachments" : ""),
                attachments: attachments
            });

            toast({
                title: "Message Sent",
                description: "Your message has been sent successfully.",
            });

            onMessageSent(newConversation.id);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to send message:", error);
            toast({
                title: "Error",
                description: "Failed to send message. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSending(false);
        }
    };

    const toggleRecipient = (recipientId: string) => {
        setSelectedRecipientIds((current) =>
            current.includes(recipientId)
                ? current.filter((id) => id !== recipientId)
                : [...current, recipientId]
        );
    };

    const removeRecipient = (recipientId: string) => {
        setSelectedRecipientIds((current) =>
            current.filter((id) => id !== recipientId)
        );
    };

    const teachers = recipients.filter((r) => r.role === "INSTRUCTOR" || r.role === "TA");
    const students = recipients.filter((r) => r.role === "STUDENT");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Compose Message</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Course Selection */}
                    <div className="grid gap-2">
                        <Label htmlFor="course">Course</Label>
                        <Select
                            value={selectedCourseId}
                            onValueChange={setSelectedCourseId}
                        >
                            <SelectTrigger id="course">
                                <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map((course) => (
                                    <SelectItem key={course.id} value={course.id}>
                                        {course.code} - {course.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Recipient Selection */}
                    <div className="grid gap-2">
                        <Label>To</Label>
                        <Popover open={recipientOpen} onOpenChange={setRecipientOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={recipientOpen}
                                    className="w-full justify-between min-h-[40px] h-auto"
                                    disabled={!selectedCourseId || isLoadingPeople}
                                >
                                    <div className="flex flex-wrap gap-1 items-center text-left">
                                        {selectedRecipientIds.length === 0 && (
                                            <span className="text-muted-foreground font-normal">
                                                {isLoadingPeople ? "Loading..." : "Select recipients..."}
                                            </span>
                                        )}
                                        {selectedRecipientIds.map((id) => {
                                            const r = recipients.find((rec) => rec.id === id);
                                            return r ? (
                                                <Badge
                                                    key={id}
                                                    variant="secondary"
                                                    className="mr-1 mb-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeRecipient(id);
                                                    }}
                                                >
                                                    {r.name}
                                                    <X className="ml-1 h-3 w-3 hover:text-destructive cursor-pointer" />
                                                </Badge>
                                            ) : null;
                                        })}
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                <Command>
                                    <CommandInput placeholder="Search people..." />
                                    <CommandList>
                                        <CommandEmpty>No people found.</CommandEmpty>
                                        {teachers.length > 0 && (
                                            <CommandGroup heading="Teachers">
                                                {teachers.map((teacher) => (
                                                    <CommandItem
                                                        key={teacher.id}
                                                        value={teacher.name}
                                                        onSelect={() => toggleRecipient(teacher.id)}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedRecipientIds.includes(teacher.id)
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {teacher.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
                                        <CommandSeparator />
                                        {students.length > 0 && (
                                            <CommandGroup heading="Students">
                                                {students.map((student) => (
                                                    <CommandItem
                                                        key={student.id}
                                                        value={student.name}
                                                        onSelect={() => toggleRecipient(student.id)}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedRecipientIds.includes(student.id)
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {student.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Subject */}
                    <div className="grid gap-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            placeholder="No subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    {/* Body */}
                    <div className="grid gap-2">
                        <Label htmlFor="body">Message</Label>
                        <Textarea
                            id="body"
                            placeholder="Type your message here..."
                            className="min-h-[150px]"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                        />

                        {/* Attachments List */}
                        {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {attachments.map((file, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md border text-sm">
                                        <File className="h-4 w-4 text-primary" />
                                        <span className="max-w-[200px] truncate">{file.fileName}</span>
                                        <button onClick={() => removeAttachment(index)} className="text-muted-foreground hover:text-destructive">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading || isSending}
                            title="Attach file"
                        >
                            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSend} disabled={isSending || isUploading}>
                            {isSending ? "Sending..." : "Send"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
