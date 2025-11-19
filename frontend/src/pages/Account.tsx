import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
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
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Globe,
  Bell,
  Lock,
  Palette,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";

const Account = () => {
  const [activeTab, setActiveTab] = useState("profile");

  const user = {
    name: "John Doe",
    email: "john.doe@university.edu",
    phone: "+1 (555) 123-4567",
    location: "Boston, MA",
    timezone: "America/New_York",
    bio: "Computer Science student passionate about web development and machine learning.",
    role: "Student",
    major: "Computer Science",
    year: "Senior",
    enrollmentDate: "Fall 2021",
    studentId: "STU-2024-78542",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    links: [
      { name: "GitHub", url: "github.com/johndoe" },
      { name: "LinkedIn", url: "linkedin.com/in/johndoe" },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  JD
                </AvatarFallback>
              </Avatar>
              <button className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">{user.name}</h1>
                  <p className="text-muted-foreground mt-0.5">{user.email}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      {user.major} · {user.year}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {user.location}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 gap-8 mb-8">
            <TabsTrigger
              value="profile"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
            >
              Security
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
            >
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-0">
            <div className="grid grid-cols-3 gap-8">
              {/* Main Form */}
              <div className="col-span-2 space-y-8">
                {/* Personal Information */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-6">Personal Information</h2>
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">First Name</Label>
                        <Input defaultValue="John" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Last Name</Label>
                        <Input defaultValue="Doe" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Bio</Label>
                      <textarea
                        className="w-full min-h-[100px] px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        defaultValue={user.bio}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Email</Label>
                      <Input defaultValue={user.email} type="email" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Phone</Label>
                        <Input defaultValue={user.phone} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Location</Label>
                        <Input defaultValue={user.location} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-6">Academic Information</h2>
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Student ID</Label>
                        <Input defaultValue={user.studentId} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Major</Label>
                        <Input defaultValue={user.major} disabled className="bg-muted" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Year</Label>
                        <Input defaultValue={user.year} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Enrollment Date</Label>
                        <Input defaultValue={user.enrollmentDate} disabled className="bg-muted" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Links */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Links
                  </h3>
                  <div className="space-y-3">
                    {user.links.map((link) => (
                      <div key={link.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{link.name}</span>
                        </div>
                        <a
                          href={`https://${link.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      Add Link
                    </Button>
                  </div>
                </div>

                {/* Timezone */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Timezone
                  </h3>
                  <Select defaultValue={user.timezone}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-0">
            <div className="max-w-2xl">
              <div className="bg-card border border-border rounded-lg divide-y divide-border">
                {[
                  { title: "Assignment Reminders", description: "Get notified 24 hours before assignments are due" },
                  { title: "Grade Updates", description: "Receive notifications when grades are posted" },
                  { title: "Announcements", description: "Get notified about course announcements" },
                  { title: "Discussion Replies", description: "Receive notifications when someone replies to your posts" },
                  { title: "Calendar Events", description: "Get reminders for upcoming calendar events" },
                  { title: "Email Notifications", description: "Receive important updates via email" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-5">
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                    <Switch defaultChecked={i < 4} />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-0">
            <div className="max-w-2xl space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Password</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Last changed 30 days ago
                    </p>
                  </div>
                  <Button variant="outline">Change Password</Button>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-4">Active Sessions</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">Chrome on MacOS</p>
                      <p className="text-xs text-muted-foreground">Boston, MA · Current session</p>
                    </div>
                    <span className="text-xs text-success font-medium">Active now</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">Safari on iPhone</p>
                      <p className="text-xs text-muted-foreground">Boston, MA · Last active 2 hours ago</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive h-7">
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="mt-0">
            <div className="max-w-2xl">
              <div className="bg-card border border-border rounded-lg divide-y divide-border">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      <Palette className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Theme</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Choose your preferred color scheme
                      </p>
                    </div>
                    <Select defaultValue="light">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Language</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Select your preferred language
                      </p>
                    </div>
                    <Select defaultValue="en">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
