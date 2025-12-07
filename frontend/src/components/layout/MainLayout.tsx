import { Outlet } from "react-router-dom";
import MainSidebar from "./MainSidebar";
import Topbar from "./Topbar";
import Bottombar from "./Bottombar";

const MainLayout = () => {
  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden">
      <MainSidebar />
      {/* Main content area - responsive margin based on sidebar visibility */}
      <div className="flex flex-col flex-1 md:ml-[80px] lg:ml-[240px] transition-all duration-200 w-full min-w-0 bg-background h-screen overflow-hidden">
        <Topbar />
        <main className="flex-1 w-full pb-20 md:pb-0 overflow-y-auto overflow-x-hidden bg-background relative min-h-0">
          <div className="w-full max-w-full min-w-0 bg-background">
            <Outlet />
          </div>
        </main>
        <Bottombar />
      </div>
    </div>
  );
};

export default MainLayout;
