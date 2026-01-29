import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, User, LogOut, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import Logo from "./Logo";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";

const Topbar = () => {
  const { user, signout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleLogout = () => {
    setShowProfileMenu(false);
    signout();
    navigate("/signin");
  };

  return (
    <section className="sticky top-0 z-40 bg-card border-b border-border w-full">
      <div className="flex-between py-4 px-5">
        <div className="flex items-center gap-3">
          <Logo collapsed={false} />
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="relative" ref={menuRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="h-10 w-10 rounded-full"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="profile"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                    <Link
                      to="/account"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-muted transition-colors"
                    >
                      <User className="h-5 w-5" strokeWidth={2} />
                      <span className="text-sm font-medium">Account</span>
                    </Link>
                    <Link
                      to="/help"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-muted transition-colors border-t border-border"
                    >
                      <HelpCircle className="h-5 w-5" strokeWidth={2} />
                      <span className="text-sm font-medium">Help</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 transition-colors border-t border-border"
                    >
                      <LogOut className="h-5 w-5" strokeWidth={2} />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/signin"
                className="flex items-center justify-center gap-2 px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-all duration-200 border border-border"
              >
                <LogOut className="h-4 w-4" strokeWidth={2} />
                <span className="text-sm font-medium">Sign In</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Topbar;
