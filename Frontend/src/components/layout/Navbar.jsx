import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Bell, MessageSquare } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";
import { messageService, notificationService } from "../../api/misc.service";
import { connectChatSocket, disconnectChatSocket } from "../../api/chatSocket";
import logo from "../../assets/logo.png";

const roleHome = { user: "/dashboard", worker: "/worker/dashboard", admin: "/admin/dashboard" };
const notificationsPath = {
  user: "/notifications",
  worker: "/worker/notifications",
  admin: "/admin/notifications",
};

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadMessageUsers, setUnreadMessageUsers] = useState(0);
  const unreadConversationIdsRef = useRef(new Set());
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const dropdownRef = useRef(null);
  const navRef = useRef(null);
  const navLinkRefs = useRef({});
  const [activeIndicator, setActiveIndicator] = useState({ left: 0, width: 0, visible: false });

  const activeNavKey = location.pathname.startsWith("/services")
    ? "services"
    : location.pathname.startsWith("/workers")
      ? "workers"
      : location.pathname === "/become-worker"
        ? "become-worker"
        : null;

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const nav = navRef.current;
      const activeLink = activeNavKey ? navLinkRefs.current[activeNavKey] : null;
      if (!nav || !activeLink) {
        setActiveIndicator((indicator) => ({ ...indicator, visible: false }));
        return;
      }

      const navBounds = nav.getBoundingClientRect();
      const linkBounds = activeLink.getBoundingClientRect();
      setActiveIndicator({ left: linkBounds.left - navBounds.left, width: linkBounds.width, visible: true });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeNavKey]);

  useEffect(() => {
    if (!isAuthenticated) {
      unreadConversationIdsRef.current = new Set();
      return undefined;
    }

    const loadUnreadCounts = () => {
      Promise.all([messageService.listConversations(), notificationService.list()])
        .then(([messagesResponse, notificationsResponse]) => {
          const conversationIds = new Set(messagesResponse.data.unreadConversationIds || []);
          unreadConversationIdsRef.current = conversationIds;
          setUnreadMessageUsers(conversationIds.size);
          setUnreadNotifications(notificationsResponse.data.unreadCount || 0);
        })
        .catch(() => {});
    };

    loadUnreadCounts();
    const interval = setInterval(loadUnreadCounts, 15000);
    const socket = connectChatSocket();
    const handleNewMessage = ({ conversationId }) => {
      if (!conversationId || unreadConversationIdsRef.current.has(String(conversationId))) return;
      unreadConversationIdsRef.current.add(String(conversationId));
      setUnreadMessageUsers(unreadConversationIdsRef.current.size);
    };
    const handleNewNotification = ({ notification }) => {
      if (notification?.type !== "new_message") {
        setUnreadNotifications((count) => count + 1);
      }
    };
    const handleNotificationCountUpdate = ({ unreadCount }) => {
      if (Number.isInteger(unreadCount) && unreadCount >= 0) {
        setUnreadNotifications(unreadCount);
      }
    };
    socket.on("message:new", handleNewMessage);
    socket.on("notification:new", handleNewNotification);
    socket.on("notification:count-updated", handleNotificationCountUpdate);

    return () => {
      clearInterval(interval);
      socket.off("message:new", handleNewMessage);
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:count-updated", handleNotificationCountUpdate);
      disconnectChatSocket();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    setDropdownOpen(false);
    navigate("/");
  };

  const profilePath =
    user?.role === "worker" ? "/worker/profile" : user?.role === "admin" ? "/admin/profile" : "/profile";
  const canBecomeWorker = !isAuthenticated || user?.role === "user";

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-canvas-soft/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="shrink-0" aria-label="CraftMIgo home">
          <img src={logo} alt="CraftMIgo" className="h-10 w-auto object-contain" />
        </Link>

        <nav ref={navRef} className="relative hidden md:flex items-center gap-6 text-sm font-medium text-ink-600">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-1 h-0.5 rounded-full bg-brand transition-all duration-300 ease-out"
            style={{ left: activeIndicator.left, width: activeIndicator.width, opacity: activeIndicator.visible ? 1 : 0 }}
          />
          <NavLink ref={(node) => { navLinkRefs.current.services = node; }} to="/services" className={({ isActive }) => isActive ? "font-semibold text-brand-dark" : "hover:text-ink-900 transition-colors"}>
            Browse Services
          </NavLink>
          <NavLink
            ref={(node) => { navLinkRefs.current.workers = node; }}
            to="/workers"
            className={({ isActive }) => isActive ? "font-semibold text-brand-dark" : "hover:text-ink-900 transition-colors"}
          >
            Find Workers
          </NavLink>
          {canBecomeWorker && (
            <NavLink ref={(node) => { navLinkRefs.current["become-worker"] = node; }} to="/become-worker" className={({ isActive }) => isActive ? "font-semibold text-brand-dark" : "hover:text-ink-900 transition-colors"}>
              Become a Worker
            </NavLink>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link to={roleHome[user?.role]} className="btn-outline">
                Dashboard
              </Link>
              <Link
                to={notificationsPath[user?.role] || "/notifications"}
                className="relative rounded-DEFAULT p-2 text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                aria-label="Notifications"
              >
                <Bell size={19} />
                <UnreadBadge count={isAuthenticated ? unreadNotifications : 0} />
              </Link>
              <Link
                to="/messages"
                className="relative rounded-DEFAULT p-2 text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                aria-label="Messages"
              >
                <MessageSquare size={19} />
                <UnreadBadge count={unreadMessageUsers} />
              </Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-denim text-sm font-semibold text-white"
                >
                  {user?.avatar?.url ? (
                    <img src={user.avatar.url} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase()
                  )}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-lg border border-ink-100 bg-white py-2 shadow-lg">
                    <div className="px-4 py-2 border-b border-ink-100">
                      <p className="text-sm font-semibold text-ink-900 truncate">{user?.name}</p>
                      <p className="text-xs text-ink-400 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to={profilePath}
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                    >
                      Go to Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-rust hover:bg-rust-light"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Login
              </Link>
              <Link to="/signup" className="btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          {isAuthenticated && (
            <>
              <Link
                to={notificationsPath[user?.role] || "/notifications"}
                className="relative rounded-full p-2 text-ink-600 active:bg-ink-50"
                aria-label="Notifications"
              >
                <Bell size={19} />
                <UnreadBadge count={isAuthenticated ? unreadNotifications : 0} />
              </Link>
              <Link to="/messages" className="relative rounded-full p-2 text-ink-600 active:bg-ink-50" aria-label="Messages">
                <MessageSquare size={19} />
                <UnreadBadge count={unreadMessageUsers} />
              </Link>
            </>
          )}
          <button className="p-2" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-ink-100 bg-canvas-soft px-4 py-4 space-y-3">
          <Link to="/services" className="block text-sm font-medium text-ink-600" onClick={() => setMobileOpen(false)}>
            Browse Services
          </Link>
          <Link to="/workers" className="block text-sm font-medium text-ink-600" onClick={() => setMobileOpen(false)}>
            Find Workers
          </Link>
          {canBecomeWorker && (
            <Link to="/become-worker" className="block text-sm font-medium text-ink-600" onClick={() => setMobileOpen(false)}>
              Become a Worker
            </Link>
          )}
          <div className="pt-3 border-t border-ink-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Link to={roleHome[user?.role]} className="btn-outline w-full" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
                <Link to={profilePath} className="btn-outline w-full" onClick={() => setMobileOpen(false)}>
                  Go to Profile
                </Link>
                <button onClick={handleLogout} className="btn-ghost w-full text-rust">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline w-full" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
                <Link to="/signup" className="btn-primary w-full" onClick={() => setMobileOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

const UnreadBadge = ({ count }) => {
  if (!count) return null;

  return (
    <span className="absolute -right-1 -top-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-rust px-1 text-[10px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
};
