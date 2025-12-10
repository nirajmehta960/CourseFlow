import { NavLink, useParams } from "react-router-dom";
import {
  Home,
  BookOpen,
  FileText,
  HelpCircle,
  BarChart3,
  Users,
  MessageSquare,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseNavbarProps {
  isFaculty?: boolean;
}

const CourseNavbar = ({ isFaculty = false }: CourseNavbarProps) => {
  const { courseId } = useParams();
  const basePath = `/courses/${courseId}`;

  const navItems = [
    { icon: Home, label: "Home", path: `${basePath}` },
    { icon: BookOpen, label: "Modules", path: `${basePath}/modules` },
    { icon: FileText, label: "Assignments", path: `${basePath}/assignments` },
    { icon: HelpCircle, label: "Quizzes", path: `${basePath}/quizzes` },
    { icon: BarChart3, label: "Grades", path: `${basePath}/grades` },
    { icon: MessageSquare, label: "Discussions", path: `${basePath}/discussions` },
    { icon: Users, label: "People", path: `${basePath}/people` },
    { icon: Video, label: "Zoom", path: `${basePath}/zoom` },
  ];

  return (
    <nav className="w-52 shrink-0 border-r border-border bg-card">
      <div className="py-4">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === basePath}
                className={({ isActive }) =>
                  cn("course-nav-link flex items-center gap-3", isActive && "active")
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default CourseNavbar;
