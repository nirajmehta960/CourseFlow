import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

interface LogoProps {
  collapsed?: boolean;
}

const Logo = ({ collapsed = false }: LogoProps) => {
  return (
    <Link
      to="/dashboard"
      className="flex items-center gap-2.5 text-sidebar-foreground"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
        <GraduationCap className="h-5 w-5 text-primary-foreground" />
      </div>
      {!collapsed && (
        <span className="font-display font-bold text-lg tracking-tight">
          CourseFlow
        </span>
      )}
    </Link>
  );
};

export default Logo;
