import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/authStore";

const SignupPage = () => {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get("role") === "worker" ? "worker" : "user";
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: defaultRole });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await register(form);
      toast.success("Check your email for the verification code.");
      navigate(`/verify-email?email=${encodeURIComponent(response.data.email)}`, {
        replace: true,
        state: { from: location.pathname },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
      if (err.response?.status === 503) {
        navigate(`/verify-email?email=${encodeURIComponent(form.email.trim())}`, {
          state: { from: location.pathname, resendAvailable: true },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-700">Create your account</h1>
      <p className="mt-1 text-sm text-ink-400">Join CraftMIgo as a customer or worker.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setForm({ ...form, role: "user" })}
          className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
            form.role === "user" ? "border-ink-900 bg-ink-900 text-white" : "border-ink-100 text-ink-600"
          }`}
        >
          I need a service
        </button>
        <button
          type="button"
          onClick={() => setForm({ ...form, role: "worker" })}
          className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
            form.role === "worker" ? "border-ink-900 bg-ink-900 text-white" : "border-ink-100 text-ink-600"
          }`}
        >
          I offer services
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" required className="input" placeholder="Enter your full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required className="input" placeholder="Enter your email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone</label>
          <input id="phone" required className="input" placeholder="Enter your phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <input id="password" type={showPassword ? "text" : "password"} required minLength={6} className="input pr-11" placeholder="Create a password (6+ characters)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-ink-400 hover:text-brand" aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-400">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-denim hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default SignupPage;
