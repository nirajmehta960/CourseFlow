import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Inbox,
  User,
  HelpCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Logo from "./Logo";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const mainNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: BookOpen, label: "Courses", path: "/courses" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: Inbox, label: "Inbox", path: "/inbox" },
];

const secondaryNavItems = [
  { icon: User, label: "Account", path: "/account" },
  { icon: HelpCircle, label: "Help", path: "/help" },
];

const MainSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "hidden md:flex fixed left-0 top-0 z-30 h-screen flex-col bg-sidebar transition-all duration-200",
        collapsed ? "w-[72px]" : "w-[80px] lg:w-[240px]"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-0 lg:px-4 border-b border-sidebar-border">
        <Logo collapsed={collapsed} />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex h-8 w-8 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 px-0 lg:px-3 space-y-1">
        {mainNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center justify-center lg:justify-start gap-0 lg:gap-3 px-0 lg:px-3 py-2.5 md:py-2 transition-all duration-200 relative",
                isActive
                  ? "md:w-12 md:h-12 md:mx-auto md:rounded-xl md:flex md:items-center md:justify-center lg:w-auto lg:h-auto lg:rounded-md bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 md:w-12 md:h-12 md:mx-auto md:rounded-xl md:flex md:items-center md:justify-center lg:w-auto lg:h-auto lg:rounded-md lg:hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="h-6 w-6 md:h-5 md:w-5 lg:h-5 lg:w-5 shrink-0" />
              <span className="hidden lg:inline truncate text-sm font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Secondary Navigation */}
      <div className="border-t border-sidebar-border py-4 px-0 lg:px-3 space-y-1">
        {secondaryNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center justify-center lg:justify-start gap-0 lg:gap-3 px-0 lg:px-3 py-2.5 md:py-2 transition-all duration-200",
                isActive
                  ? "md:w-12 md:h-12 md:mx-auto md:rounded-xl md:flex md:items-center md:justify-center lg:w-auto lg:h-auto lg:rounded-md bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 md:w-12 md:h-12 md:mx-auto md:rounded-xl md:flex md:items-center md:justify-center lg:w-auto lg:h-auto lg:rounded-md lg:hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="h-6 w-6 md:h-5 md:w-5 lg:h-5 lg:w-5 shrink-0" />
              <span className="hidden lg:inline truncate text-sm font-medium">{item.label}</span>
            </NavLink>
          );
        })}
        <NavLink
          to="/signin"
          className="flex items-center justify-center lg:justify-start gap-0 lg:gap-3 px-0 lg:px-3 py-2.5 md:py-2 md:w-12 md:h-12 md:mx-auto md:rounded-xl lg:w-auto lg:h-auto lg:rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="h-6 w-6 md:h-5 md:w-5 lg:h-5 lg:w-5 shrink-0" />
          <span className="hidden lg:inline truncate text-sm font-medium">Sign Out</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default MainSidebar;
