import { NavLink } from "react-router-dom";
import { Briefcase, Home, LayoutDashboard, MessageSquare, Search, UserRound, Users } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const guestLinks = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/services", label: "Services", icon: Search },
  { to: "/workers", label: "Workers", icon: Users },
  { to: "/login", label: "Login", icon: UserRound },
  { to: "/signup", label: "Sign up", icon: Briefcase },
];

const roleLinks = {
  user: [
    { to: "/", label: "Home", icon: Home, end: true },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/services", label: "Services", icon: Search },
    { to: "/messages", label: "Messages", icon: MessageSquare },
    { to: "/profile", label: "Profile", icon: UserRound },
  ],
  worker: [
    { to: "/", label: "Home", icon: Home, end: true },
    { to: "/worker/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/worker/services", label: "Services", icon: Briefcase },
    { to: "/messages", label: "Messages", icon: MessageSquare },
    { to: "/worker/profile", label: "Profile", icon: UserRound },
  ],
  admin: [
    { to: "/", label: "Home", icon: Home, end: true },
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/services", label: "Services", icon: Search },
    { to: "/messages", label: "Messages", icon: MessageSquare },
    { to: "/admin/profile", label: "Profile", icon: UserRound },
  ],
};

const MobileBottomNav = () => {
  const { user, isAuthenticated } = useAuthStore();

  const links = isAuthenticated ? roleLinks[user?.role] || roleLinks.user : guestLinks;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-ink-100 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-6px_20px_rgba(6,59,36,0.08)] backdrop-blur md:hidden" aria-label="Mobile navigation">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors ${
                isActive ? "bg-brand-dark text-white" : "text-ink-500 active:bg-ink-50"
              }`
            }
          >
            <link.icon size={18} strokeWidth={2} />
            <span className="truncate">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
