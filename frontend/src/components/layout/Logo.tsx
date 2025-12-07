import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

interface LogoProps {
  collapsed?: boolean;
}

const Logo = ({ collapsed = false }: LogoProps) => {
  return (
    <Link
      to="/dashboard"
      className="flex items-center lg:gap-2.5 justify-center lg:justify-start text-sidebar-foreground"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shrink-0">
        <GraduationCap className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="hidden lg:flex flex-col justify-center">
        <span className="font-display font-bold text-lg tracking-tight">
          CourseFlow
        </span>
      </div>
    </Link>
  );
};

export default Logo;
