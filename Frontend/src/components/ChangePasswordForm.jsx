import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { authService } from "../api/auth.service";

const initialForm = { oldPassword: "", newPassword: "", confirmPassword: "" };

const ChangePasswordForm = () => {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState({ oldPassword: false, newPassword: false, confirmPassword: false });

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    setSaving(true);
    try {
      await authService.changePassword(form);
      setForm(initialForm);
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 card space-y-4 p-5">
      <div className="flex items-center gap-2">
        <LockKeyhole size={18} className="text-denim" />
        <div>
          <h2 className="font-semibold text-ink-900">Change password</h2>
          <p className="text-sm text-ink-400">Use your current password to set a new one.</p>
        </div>
      </div>

      <PasswordField
        id="oldPassword"
        label="Current password"
        value={form.oldPassword}
        visible={visible.oldPassword}
        onChange={(value) => updateField("oldPassword", value)}
        onToggle={() => setVisible((current) => ({ ...current, oldPassword: !current.oldPassword }))}
      />
      <PasswordField
        id="newPassword"
        label="New password"
        value={form.newPassword}
        visible={visible.newPassword}
        onChange={(value) => updateField("newPassword", value)}
        onToggle={() => setVisible((current) => ({ ...current, newPassword: !current.newPassword }))}
        minLength={6}
      />
      <PasswordField
        id="confirmPassword"
        label="Confirm new password"
        value={form.confirmPassword}
        visible={visible.confirmPassword}
        onChange={(value) => updateField("confirmPassword", value)}
        onToggle={() => setVisible((current) => ({ ...current, confirmPassword: !current.confirmPassword }))}
        minLength={6}
      />

      <button disabled={saving} type="submit" className="btn-primary">
        {saving ? "Changing..." : "Change password"}
      </button>
    </form>
  );
};

const PasswordField = ({ id, label, value, visible, onChange, onToggle, minLength }) => (
  <div>
    <label className="label" htmlFor={id}>{label}</label>
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        required
        minLength={minLength}
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

export default ChangePasswordForm;
