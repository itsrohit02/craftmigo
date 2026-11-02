import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";

const MainLayout = () => {
  const location = useLocation();
  const isConversationPage = location.pathname.startsWith("/messages/");

  return (
    <div className="flex min-h-screen flex-col">
      {!isConversationPage && <Navbar />}
      <main className={`flex-1 ${isConversationPage ? "" : "pb-20 md:pb-0"}`}>
        <Outlet />
      </main>
      {!isConversationPage && <Footer />}
      <MobileBottomNav />
    </div>
  );
};

export default MainLayout;
