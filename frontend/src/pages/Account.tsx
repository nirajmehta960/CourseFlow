import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  GraduationCap,
  Globe,
  MapPin,
  Link as LinkIcon,
  ExternalLink,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile, UserInfo } from "@/lib/auth-api";
import { uploadFileToS3 } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Account = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<UserInfo>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        bio: user.bio || "",
        phone: user.phone || "",
        location: user.location || "",
        major: user.major || "",
        year: user.year || "",
        enrollmentDate: user.enrollmentDate || "",
        studentId: user.studentId || "",
        avatarUrl: user.avatarUrl || "",
        timezone: user.timezone || "America/New_York",
        links: user.links || [],
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLinkChange = (index: number, field: "name" | "url", value: string) => {
    const newLinks = [...(formData.links || [])];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData((prev) => ({ ...prev, links: newLinks }));
  };

  const addLink = () => {
    setFormData((prev) => ({
      ...prev,
      links: [...(prev.links || []), { name: "", url: "" }],
    }));
  };

  const removeLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      links: (prev.links || []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await updateProfile(user.id, formData);
      await refreshUser();
      setIsEditing(false); // Exit edit mode on success
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Upload file directly to S3
      const uploadResponse = await uploadFileToS3(file);

      // Allow immediate preview
      const newAvatarUrl = uploadResponse.url;
      setFormData(prev => ({ ...prev, avatarUrl: newAvatarUrl }));

      // Save immediately
      await updateProfile(user.id, { avatarUrl: newAvatarUrl });
      await refreshUser();

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return <div className="p-8 text-center text-muted-foreground">Loading user data...</div>;
  }

  return (
    <div className="w-full min-h-full bg-background overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background shadow-lg">
                <AvatarImage src={formData.avatarUrl || user.avatarUrl} alt={formData.name || user.name} />
                <AvatarFallback className="text-xl sm:text-2xl bg-primary text-primary-foreground">
                  {getInitials(formData.name || user.name)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <button
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-semibold text-foreground truncate">{formData.name || user.name}</h1>
                  <p className="text-sm sm:text-base text-muted-foreground mt-0.5 truncate">{user.email}</p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-3">
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                      <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">
                        {user.roles.includes("INSTRUCTOR")
                          ? (formData.year || "Instructor")
                          : user.roles[0]}
                        {formData.major ? ` · ${formData.major}` : ""}
                      </span>
                    </span>
                    {formData.location && (
                      <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="truncate">{formData.location}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 gap-8 mb-8">
            <TabsTrigger
              value="profile"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
            >
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                {/* Personal Information */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
                    {!isEditing && (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit Profile
                      </Button>
                    )}
                  </div>
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Name</Label>
                        {isEditing ? (
                          <Input
                            name="name"
                            value={formData.name || ""}
                            onChange={handleChange}
                          />
                        ) : (
                          <p className="text-sm text-foreground py-2 border-b border-transparent">{formData.name}</p>
                        )}
                      </div>

                      {/* Email - Always Read Only */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Email</Label>
                        <p className="text-sm text-muted-foreground py-2 border-b border-transparent">{user.email}</p>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Bio</Label>
                      {isEditing ? (
                        <textarea
                          name="bio"
                          className="w-full min-h-[100px] px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                          value={formData.bio || ""}
                          onChange={handleChange}
                        />
                      ) : (
                        <p className="text-sm text-foreground py-2 min-h-[2.5rem]">{formData.bio || "No bio added."}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Phone */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Phone</Label>
                        {isEditing ? (
                          <Input
                            name="phone"
                            value={formData.phone || ""}
                            onChange={handleChange}
                          />
                        ) : (
                          <p className="text-sm text-foreground py-2">{formData.phone || "Not set"}</p>
                        )}
                      </div>

                      {/* Location */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Location</Label>
                        {isEditing ? (
                          <Input
                            name="location"
                            value={formData.location || ""}
                            onChange={handleChange}
                          />
                        ) : (
                          <p className="text-sm text-foreground py-2">{formData.location || "Not set"}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Academic/Professional Information */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-6">
                    {user.roles.includes("INSTRUCTOR") ? "Professional Information" : "Academic Information"}
                  </h2>
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Student/Employee ID */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          {user.roles.includes("INSTRUCTOR") ? "Employee ID" : "Student ID"}
                        </Label>
                        {isEditing ? (
                          <Input
                            name="studentId"
                            value={formData.studentId || ""}
                            onChange={handleChange}
                            placeholder={user.roles.includes("INSTRUCTOR") ? "Enter Employee ID" : "Enter Student ID"}
                          />
                        ) : (
                          <p className="text-sm text-foreground py-2">{formData.studentId || "Not set"}</p>
                        )}
                      </div>

                      {/* Major/Department */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          {user.roles.includes("INSTRUCTOR") ? "Department" : "Major"}
                        </Label>
                        {isEditing ? (
                          <Input
                            name="major"
                            value={formData.major || ""}
                            onChange={handleChange}
                            placeholder={user.roles.includes("INSTRUCTOR") ? "e.g. Computer Science" : "e.g. Computer Science"}
                          />
                        ) : (
                          <p className="text-sm text-foreground py-2">{formData.major || "Not set"}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Year/Title */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          {user.roles.includes("INSTRUCTOR") ? "Title" : "Year"}
                        </Label>
                        {isEditing ? (
                          <Input
                            name="year"
                            value={formData.year || ""}
                            onChange={handleChange}
                            placeholder={user.roles.includes("INSTRUCTOR") ? "e.g. Associate Professor" : "e.g. Senior"}
                          />
                        ) : (
                          <p className="text-sm text-foreground py-2">{formData.year || "Not set"}</p>
                        )}
                      </div>

                      {/* Enrollment/Joined Date */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          {user.roles.includes("INSTRUCTOR") ? "Date Joined" : "Enrollment Date"}
                        </Label>
                        {isEditing ? (
                          <Input
                            name="enrollmentDate"
                            value={formData.enrollmentDate || ""}
                            onChange={handleChange}
                            placeholder={user.roles.includes("INSTRUCTOR") ? "e.g. Fall 2020" : "e.g. Fall 2021"}
                          />
                        ) : (
                          <p className="text-sm text-foreground py-2">{formData.enrollmentDate || "Not set"}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6 lg:col-span-1">
                {/* Links */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Links
                  </h3>
                  {isEditing ? (
                    <div className="space-y-3">
                      {formData.links?.map((link, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <div className="grid grid-cols-1 gap-2 flex-1">
                            <Input
                              placeholder="Name (e.g. GitHub)"
                              value={link.name}
                              onChange={(e) => handleLinkChange(i, "name", e.target.value)}
                              className="h-8 text-sm"
                            />
                            <Input
                              placeholder="URL"
                              value={link.url}
                              onChange={(e) => handleLinkChange(i, "url", e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                            onClick={() => removeLink(i)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full mt-2" onClick={addLink}>
                        <Plus className="h-4 w-4 mr-2" /> Add Link
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {formData.links && formData.links.length > 0 ? (
                        formData.links.map((link, i) => (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {link.name || link.url}
                          </a>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No links added</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Timezone */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Timezone
                  </h3>
                  {isEditing ? (
                    <Select
                      value={formData.timezone}
                      onValueChange={(val) => handleSelectChange("timezone", val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-foreground">
                      {formData.timezone === "America/New_York" && "Eastern Time (ET)"}
                      {formData.timezone === "America/Chicago" && "Central Time (CT)"}
                      {formData.timezone === "America/Denver" && "Mountain Time (MT)"}
                      {formData.timezone === "America/Los_Angeles" && "Pacific Time (PT)"}
                      {!["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"].includes(formData.timezone || "") && (formData.timezone || "Not set")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Account;
