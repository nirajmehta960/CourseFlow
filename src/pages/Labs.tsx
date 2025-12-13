import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FlaskConical,
  Code,
  Cpu,
  Database,
  Beaker,
  Microscope,
  Plus,
  Clock,
  Users,
} from "lucide-react";

const labs = [
  {
    id: 1,
    name: "Virtual Chemistry Lab",
    description: "Conduct virtual chemistry experiments with realistic simulations",
    icon: Beaker,
    status: "available",
    duration: "2 hours",
    participants: 12,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 2,
    name: "Code Sandbox",
    description: "Practice coding with an integrated development environment",
    icon: Code,
    status: "available",
    duration: "Unlimited",
    participants: 45,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: 3,
    name: "Circuit Simulator",
    description: "Design and test electronic circuits virtually",
    icon: Cpu,
    status: "maintenance",
    duration: "3 hours",
    participants: 8,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: 4,
    name: "Database Playground",
    description: "Learn SQL and database design with hands-on exercises",
    icon: Database,
    status: "available",
    duration: "1 hour",
    participants: 23,
    color: "from-orange-500 to-amber-500",
  },
  {
    id: 5,
    name: "Physics Simulation",
    description: "Explore physics concepts through interactive simulations",
    icon: FlaskConical,
    status: "available",
    duration: "2 hours",
    participants: 15,
    color: "from-rose-500 to-red-500",
  },
  {
    id: 6,
    name: "Biology Lab",
    description: "Virtual microscopy and biological experiments",
    icon: Microscope,
    status: "coming-soon",
    duration: "2 hours",
    participants: 0,
    color: "from-green-500 to-emerald-500",
  },
];

const Labs = () => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-success text-success-foreground">Available</Badge>;
      case "maintenance":
        return <Badge variant="secondary">Maintenance</Badge>;
      case "coming-soon":
        return <Badge variant="outline">Coming Soon</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Virtual Labs
        </h1>
        <p className="text-muted-foreground mt-1">
          Access virtual laboratory environments for hands-on learning.
        </p>
      </div>

      {/* Lab Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {labs.map((lab, index) => {
          const Icon = lab.icon;
          return (
            <Card
              key={lab.id}
              className="card-hover overflow-hidden opacity-0 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`h-32 bg-gradient-to-br ${lab.color} p-6 flex items-end`}>
                <Icon className="h-12 w-12 text-white/90" />
              </div>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-display font-semibold text-lg text-foreground">
                    {lab.name}
                  </h3>
                  {getStatusBadge(lab.status)}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {lab.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {lab.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {lab.participants} active
                  </span>
                </div>
                <Button
                  className="w-full"
                  disabled={lab.status !== "available"}
                >
                  {lab.status === "available" ? "Launch Lab" : "Unavailable"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Request Lab */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Request a New Lab
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Can't find the lab you need? Submit a request and we'll work on adding it.
          </p>
          <Button variant="outline">Submit Request</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Labs;
