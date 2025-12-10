import { Outlet } from "react-router-dom";
import MainSidebar from "./MainSidebar";

const MainLayout = () => {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <MainSidebar />
      {/* Main content area - offset by sidebar width */}
      <main className="ml-[240px] flex-1 transition-all duration-200">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
