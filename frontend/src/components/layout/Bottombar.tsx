import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, Calendar, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const bottombarLinks = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: BookOpen, label: "Courses", path: "/courses" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: Inbox, label: "Inbox", path: "/inbox" },
];

const Bottombar = () => {
  const pathname = useLocation().pathname;
  const { user } = useAuth();

  // Don't show bottombar on auth pages
  if (!user || pathname.startsWith("/signin") || pathname.startsWith("/signup")) {
    return null;
  }

  return (
    <section className="z-40 flex justify-around items-center w-full fixed bottom-0 left-0 right-0 bg-card border-t border-border px-5 py-4 md:hidden rounded-t-[20px]">
      {bottombarLinks.map((link) => {
        const isActive = pathname.startsWith(link.path);
        const IconComponent = link.icon;

        return (
          <Link
            to={link.path}
            key={link.label}
            className="flex-center flex-col gap-1 transition group relative"
          >
            <div
              className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-2xl transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground bg-transparent hover:text-foreground"
              )}
            >
              <IconComponent
                className="h-6 w-6"
                strokeWidth={isActive ? 2.5 : 2}
              />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">
              {link.label}
            </span>
          </Link>
        );
      })}
    </section>
  );
};

export default Bottombar;
