import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import ChangePasswordForm from "../components/ChangePasswordForm";

const profilePaths = {
  user: "/profile",
  worker: "/worker/profile",
  admin: "/admin/profile",
};

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.user?.role);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <button type="button" onClick={() => navigate(profilePaths[role] || "/profile")} className="btn-ghost mb-5 gap-2 px-0">
        <ArrowLeft size={17} /> Back to profile
      </button>
      <h1 className="text-2xl font-700">Change password</h1>
      <ChangePasswordForm />
      <p className="mt-4 text-center text-sm text-ink-400">
        Forgot your current password?{" "}
        <Link to="/forgot-password" className="font-medium text-denim hover:underline">
          Reset it by email
        </Link>
      </p>
    </div>
  );
};

export default ChangePasswordPage;
