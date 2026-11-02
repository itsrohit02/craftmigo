import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { authService } from "../api/auth.service";

const ForgotPasswordPage = () => {
  const [form, setForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [visible, setVisible] = useState({ newPassword: false, confirmPassword: false });
  const navigate = useNavigate();

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleRequestCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await authService.requestPasswordReset(form.email);
      setSent(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(form);
      toast.success("Password reset successfully");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await authService.requestPasswordReset(form.email);
      toast.success("A new reset code has been sent if an account exists for that email");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send reset code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <Link to="/login" className="btn-ghost mb-5 w-fit gap-2 px-0">
        <ArrowLeft size={17} /> Back to login
      </Link>
      <div className="flex items-center gap-2">
        {sent ? <KeyRound size={20} className="text-denim" /> : <Mail size={20} className="text-denim" />}
        <h1 className="text-2xl font-700">{sent ? "Reset your password" : "Forgot password?"}</h1>
      </div>

      {!sent ? (
        <>
          <p className="mt-1 text-sm text-ink-400">Enter your registered email and we will send you a 6-digit reset code.</p>
          <form onSubmit={handleRequestCode} className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                required
                className="input"
                placeholder="Enter your registered email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Sending..." : "Send reset code"}
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink-400">
            If an account exists for <span className="font-medium">{form.email}</span>, a 6-digit code has been sent. It expires in 15 minutes.
          </p>
          <form onSubmit={handleResetPassword} className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="reset-otp">Email verification code</label>
              <input
                id="reset-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                className="input"
                placeholder="Enter 6-digit code"
                value={form.otp}
                onChange={(event) => updateField("otp", event.target.value.replace(/\D/g, ""))}
              />
            </div>
            <PasswordField
              id="new-password"
              label="New password"
              value={form.newPassword}
              visible={visible.newPassword}
              onChange={(value) => updateField("newPassword", value)}
              onToggle={() => setVisible((current) => ({ ...current, newPassword: !current.newPassword }))}
            />
            <PasswordField
              id="confirm-password"
              label="Confirm new password"
              value={form.confirmPassword}
              visible={visible.confirmPassword}
              onChange={(value) => updateField("confirmPassword", value)}
              onToggle={() => setVisible((current) => ({ ...current, confirmPassword: !current.confirmPassword }))}
            />
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Saving..." : "Reset password"}
            </button>
          </form>
          <div className="mt-4 flex justify-between text-sm">
            <button type="button" onClick={() => setSent(false)} className="font-medium text-denim hover:underline">
              Change email
            </button>
            <button type="button" onClick={handleResendCode} disabled={loading} className="font-medium text-denim hover:underline disabled:opacity-50">
              Resend code
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const PasswordField = ({ id, label, value, visible, onChange, onToggle }) => (
  <div>
    <label className="label" htmlFor={id}>{label}</label>
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        required
        minLength={6}
        className="input pr-11"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-ink-400 hover:text-brand"
        aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  </div>
);

export default ForgotPasswordPage;
