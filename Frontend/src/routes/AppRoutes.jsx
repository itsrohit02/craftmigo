import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  Heart,
  User,
  Briefcase,
  ClipboardList,
  Wallet,
  Image,
  ShieldCheck,
  Users,
  CreditCard,
  Star,
  Bell,
  MessageSquareText,
  Settings2,
} from "lucide-react";

import MainLayout from "../components/layout/MainLayout";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";

const HomePage = lazy(() => import("../pages/HomePage"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const SignupPage = lazy(() => import("../pages/SignupPage"));
const ServicesPage = lazy(() => import("../pages/ServicesPage"));
const ServiceDetailsPage = lazy(() => import("../pages/ServiceDetailsPage"));
const WorkerProfilePage = lazy(() => import("../pages/WorkerProfilePage"));
const WorkersPage = lazy(() => import("../pages/WorkersPage"));
const ComingSoonPage = lazy(() => import("../pages/ComingSoonPage"));
const ContactPage = lazy(() => import("../pages/ContactPage"));
const PrivacyPolicyPage = lazy(() => import("../pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("../pages/TermsOfServicePage"));
const CustomerDashboardPage = lazy(() => import("../pages/customer/DashboardPage"));
const MyBookingsPage = lazy(() => import("../pages/customer/MyBookingsPage"));
const BookingDetailsPage = lazy(() => import("../pages/BookingDetailsPage"));
const CustomerProfilePage = lazy(() => import("../pages/customer/ProfilePage"));
const FavoritesPage = lazy(() => import("../pages/customer/FavoritesPage"));
const BookServicePage = lazy(() => import("../pages/customer/BookServicePage"));
const AddReviewPage = lazy(() => import("../pages/customer/AddReviewPage"));
const MyReviewsPage = lazy(() => import("../pages/customer/MyReviewsPage"));
const WorkerDashboardPage = lazy(() => import("../pages/worker/WorkerDashboardPage"));
const WorkerSetupPage = lazy(() => import("../pages/worker/WorkerSetupPage"));
const WorkerEditProfilePage = lazy(() => import("../pages/worker/WorkerEditProfilePage"));
const MyServicesPage = lazy(() => import("../pages/worker/MyServicesPage"));
const AddServicePage = lazy(() => import("../pages/worker/AddServicePage"));
const BookingRequestsPage = lazy(() => import("../pages/worker/BookingRequestsPage"));
const WorkerBookingsPage = lazy(() => import("../pages/worker/WorkerBookingsPage"));
const WorkerReviewsPage = lazy(() => import("../pages/worker/ReviewsPage"));
const EarningsPage = lazy(() => import("../pages/worker/EarningsPage"));
const PortfolioPage = lazy(() => import("../pages/worker/PortfolioPage"));
const VerificationPage = lazy(() => import("../pages/worker/VerificationPage"));
const AdminDashboardPage = lazy(() => import("../pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("../pages/admin/UsersPage"));
const AdminWorkersPage = lazy(() => import("../pages/admin/WorkersPage"));
const AdminBookingsPage = lazy(() => import("../pages/admin/BookingsPage"));
const AdminPaymentsPage = lazy(() => import("../pages/admin/PaymentsPage"));
const AdminReviewsPage = lazy(() => import("../pages/admin/ReviewsPage"));
const AdminProfilePage = lazy(() => import("../pages/admin/ProfilePage"));
const ContactSettingsPage = lazy(() => import("../pages/admin/ContactSettingsPage"));
const AdminFeedbackPage = lazy(() => import("../pages/admin/FeedbackPage"));
const MessagesPage = lazy(() => import("../pages/MessagesPage"));
const ConversationPage = lazy(() => import("../pages/ConversationPage"));
const NotificationsPage = lazy(() => import("../pages/NotificationsPage"));
const ChangePasswordPage = lazy(() => import("../pages/ChangePasswordPage"));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage"));
const VerifyEmailPage = lazy(() => import("../pages/VerifyEmailPage"));

const customerLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/bookings", label: "My Bookings", icon: CalendarCheck },
  { to: "/dashboard/favorites", label: "Favorites", icon: Heart },
  { to: "/dashboard/reviews", label: "My Reviews", icon: MessageSquareText },
  { to: "/profile", label: "Profile", icon: User },
];

const workerLinks = [
  { to: "/worker/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/worker/my-bookings", label: "My Bookings", icon: CalendarCheck },
  { to: "/worker/favorites", label: "Favorites", icon: Heart },
  { to: "/worker/services", label: "My Services", icon: Briefcase },
  { to: "/worker/requests", label: "Booking Requests", icon: ClipboardList },
  { to: "/worker/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/worker/reviews", label: "Reviews", icon: Star },
  { to: "/worker/my-reviews", label: "My Reviews", icon: MessageSquareText },
  { to: "/worker/earnings", label: "Earnings", icon: Wallet },
  { to: "/worker/portfolio", label: "Portfolio", icon: Image },
  { to: "/worker/verification", label: "Verification", icon: ShieldCheck },
  { to: "/worker/profile", label: "Profile", icon: User },
];

const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/workers", label: "Workers", icon: Briefcase },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/feedback", label: "Feedback", icon: MessageSquareText },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/settings/contact", label: "Contact Settings", icon: Settings2 },
  { to: "/admin/profile", label: "Profile", icon: User },
];

const AppRoutes = () => (
  <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center">Loading…</div>}>
  <Routes>
    {/* Public / guest-accessible */}
    <Route element={<MainLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/services/:id" element={<ServiceDetailsPage />} />
      <Route path="/workers" element={<WorkersPage />} />
      <Route path="/workers/:id" element={<WorkerProfilePage />} />
      <Route path="/become-worker" element={<SignupPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />

      {/* Authenticated, shared-across-roles */}
      <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
      <Route path="/messages/:conversationId" element={<ProtectedRoute><ConversationPage /></ProtectedRoute>} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
      <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetailsPage /></ProtectedRoute>} />

      {/* Customer-only, no sidebar */}
      <Route path="/book/:serviceId" element={<ProtectedRoute roles={["user", "worker"]}><BookServicePage /></ProtectedRoute>} />
      <Route path="/bookings/:id/review" element={<ProtectedRoute roles={["user", "worker"]}><AddReviewPage /></ProtectedRoute>} />
    </Route>

    {/* Customer dashboard (sidebar) */}
    <Route
      element={
        <ProtectedRoute roles={["user"]}>
          <DashboardLayout links={customerLinks} title="Customer" />
        </ProtectedRoute>
      }
    >
      <Route path="/dashboard" element={<CustomerDashboardPage />} />
      <Route path="/dashboard/bookings" element={<MyBookingsPage />} />
      <Route path="/dashboard/favorites" element={<FavoritesPage />} />
      <Route path="/dashboard/reviews" element={<MyReviewsPage />} />
      <Route path="/profile" element={<CustomerProfilePage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
    </Route>

    {/* Worker dashboard (sidebar) */}
    <Route
      element={
        <ProtectedRoute roles={["worker"]}>
          <DashboardLayout links={workerLinks} title="Worker" />
        </ProtectedRoute>
      }
    >
      <Route path="/worker/dashboard" element={<WorkerDashboardPage />} />
      <Route path="/worker/my-bookings" element={<MyBookingsPage />} />
      <Route path="/worker/favorites" element={<FavoritesPage />} />
      <Route path="/worker/services" element={<MyServicesPage />} />
      <Route path="/worker/services/new" element={<AddServicePage />} />
      <Route path="/worker/services/:id/edit" element={<AddServicePage />} />
      <Route path="/worker/requests" element={<BookingRequestsPage />} />
      <Route path="/worker/bookings" element={<WorkerBookingsPage />} />
      <Route path="/worker/reviews" element={<WorkerReviewsPage />} />
      <Route path="/worker/my-reviews" element={<MyReviewsPage />} />
      <Route path="/worker/earnings" element={<EarningsPage />} />
      <Route path="/worker/portfolio" element={<PortfolioPage />} />
      <Route path="/worker/verification" element={<VerificationPage />} />
      <Route path="/worker/profile" element={<WorkerEditProfilePage />} />
      <Route path="/worker/notifications" element={<NotificationsPage />} />
    </Route>

    {/* Worker setup - standalone, no sidebar (pre-completion flow) */}
    <Route
      path="/worker/setup"
      element={
        <ProtectedRoute roles={["worker"]}>
          <WorkerSetupPage />
        </ProtectedRoute>
      }
    />

    {/* Admin dashboard (sidebar) */}
    <Route
      element={
        <ProtectedRoute roles={["admin"]}>
          <DashboardLayout links={adminLinks} title="Admin" />
        </ProtectedRoute>
      }
    >
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/admin/users" element={<AdminUsersPage />} />
      <Route path="/admin/workers" element={<AdminWorkersPage />} />
      <Route path="/admin/bookings" element={<AdminBookingsPage />} />
      <Route path="/admin/payments" element={<AdminPaymentsPage />} />
      <Route path="/admin/reviews" element={<AdminReviewsPage />} />
      <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
      <Route path="/admin/settings/contact" element={<ContactSettingsPage />} />
      <Route path="/admin/profile" element={<AdminProfilePage />} />
      <Route path="/admin/notifications" element={<NotificationsPage />} />
    </Route>

    <Route path="*" element={<ComingSoonPage title="Page not found" />} />
  </Routes>
  </Suspense>
);

export default AppRoutes;
