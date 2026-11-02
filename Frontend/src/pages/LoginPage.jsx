import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/authStore";

const roleHome = { user: "/dashboard", worker: "/worker/dashboard", admin: "/admin/dashboard" };

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
      const redirectTo = location.state?.from?.pathname || roleHome[user.role] || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
      if (err.response?.status === 403 && err.response?.data?.message?.includes("verify your email")) {
        navigate(`/verify-email?email=${encodeURIComponent(form.email.trim())}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-700">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-400">Log in to continue to CraftMIgo.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            className="input"
            placeholder="Enter your email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              className="input pr-11"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-ink-400 hover:text-brand" aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>

      <Link to="/forgot-password" className="mt-4 text-center text-sm font-medium text-denim hover:underline">
        Forgot password?
      </Link>

      <p className="mt-6 text-center text-sm text-ink-400">
        Don't have an account?{" "}
        <Link to="/signup" className="font-medium text-denim hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
