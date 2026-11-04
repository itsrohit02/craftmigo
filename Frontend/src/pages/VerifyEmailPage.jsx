import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, MailCheck } from "lucide-react";
import { authService } from "../api/auth.service";
import { useAuthStore } from "../store/authStore";

const roleHome = { user: "/dashboard", worker: "/worker/setup", admin: "/admin/dashboard" };

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsVerifying(true);
    try {
      const user = await verifyEmail({ email, otp });
      toast.success("Email verified successfully");
      navigate(roleHome[user.role] || "/", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not verify email");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      toast.error("Enter your email address first");
      return;
    }

    setIsResending(true);
    try {
      const response = await authService.resendEmailVerificationCode(email);
      toast.success(response.message || "If your account needs verification, a new code has been sent");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not resend verification code");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <Link to="/signup" className="btn-ghost mb-5 w-fit gap-2 px-0">
        <ArrowLeft size={17} /> Back to signup
      </Link>
      <div className="flex items-center gap-2">
        <MailCheck size={20} className="text-denim" />
        <h1 className="text-2xl font-700">Verify your email</h1>
      </div>
      <p className="mt-1 text-sm text-ink-400">
        Enter the 6-digit code sent to your email. The code expires in 15 minutes.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="label" htmlFor="verification-email">Email</label>
          <input
            id="verification-email"
            type="email"
            required
            className="input"
            placeholder="Enter your registered email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="verification-otp">Verification code</label>
          <input
            id="verification-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            className="input"
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
          />
        </div>
        <button type="submit" disabled={isVerifying} className="btn-primary w-full">
          {isVerifying ? "Verifying..." : "Verify email"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleResend}
        disabled={isResending}
        className="mt-4 text-sm font-medium text-denim hover:underline disabled:opacity-50"
      >
        {isResending ? "Sending..." : "Resend verification code"}
      </button>

      <p className="mt-6 text-center text-sm text-ink-400">
        Already verified?{" "}
        <Link to="/login" className="font-medium text-denim hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default VerifyEmailPage;
