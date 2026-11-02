import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import Navbar from "./Navbar";
import MobileBottomNav from "./MobileBottomNav";

const DashboardLayout = ({ links, title }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/");
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas-soft">
      <div className="shrink-0">
        <Navbar />
      </div>
      <nav className="scrollbar-hidden flex shrink-0 gap-2 overflow-x-auto border-b border-ink-100 bg-white px-4 py-2 md:hidden" aria-label={`${title} navigation`}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                isActive ? "bg-brand-dark text-white" : "bg-ink-50 text-ink-600 active:bg-brand/10"
              }`
            }
          >
            <link.icon size={15} />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="flex min-h-0 min-w-0 flex-1">
        <aside className="hidden min-h-0 w-64 shrink-0 flex-col border-r border-ink-100 bg-white md:flex">
          <p className="px-6 pt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">{title}</p>
          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-DEFAULT px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                  }`
                }
              >
                <link.icon size={18} />
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-ink-100 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-denim text-sm font-semibold text-white shrink-0">
                {user?.avatar?.url ? (
                  <img src={user.avatar.url} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900 truncate">{user?.name}</p>
                <p className="text-xs text-ink-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-ghost w-full justify-start gap-2 text-rust">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </aside>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <main className="min-h-full p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-8">
            <Outlet />
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default DashboardLayout;
