import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";
import { userService } from "../../api/user.service";

const AdminProfilePage = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: {
      line1: user?.address?.line1 || "",
      city: user?.address?.city || "",
      state: user?.address?.state || "",
      pincode: user?.address?.pincode || "",
    },
  });

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const response = await userService.updateAvatar(formData);
      setUser(response.data.user);
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await userService.updateProfile(form);
      setUser(response.data.user);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-700">Admin Profile</h1>
        <div className="flex gap-3">
          <button type="button" onClick={() => setEditing((value) => !value)} className="btn-outline">
            {editing ? "Cancel" : "Edit"}
          </button>
          <button type="button" onClick={() => navigate("/change-password")} className="btn-outline">Change password</button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-5">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-denim text-xl font-semibold text-white">
            {user?.avatar?.url ? (
              <img src={user.avatar.url} alt="" className="h-full w-full object-cover" />
            ) : (
              user?.name?.charAt(0)?.toUpperCase()
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current.click()}
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-amber text-ink-900 shadow"
            aria-label="Change profile photo"
          >
            <Camera size={13} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="text-lg font-semibold text-ink-900">{user?.name}</p>
          <p className="text-sm text-ink-400">{user?.email}</p>
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="mt-8 card space-y-4 p-5">
          <div>
            <label className="label">Name</label>
            <input className="input" placeholder="Enter your full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" placeholder="Enter your phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" placeholder="House number and street" value={form.address.line1} onChange={(event) => setForm({ ...form, address: { ...form.address, line1: event.target.value } })} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input className="input" placeholder="City" value={form.address.city} onChange={(event) => setForm({ ...form, address: { ...form.address, city: event.target.value } })} />
            <input className="input" placeholder="State" value={form.address.state} onChange={(event) => setForm({ ...form, address: { ...form.address, state: event.target.value } })} />
          </div>
          <input className="input" placeholder="Pincode" value={form.address.pincode} onChange={(event) => setForm({ ...form, address: { ...form.address, pincode: event.target.value } })} />
          <button disabled={saving} type="submit" className="btn-primary">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      ) : (
        <div className="mt-8 card space-y-3 p-5 text-sm">
          <ProfileRow label="Phone" value={user?.phone} />
          <ProfileRow label="Address" value={[user?.address?.line1, user?.address?.city, user?.address?.state, user?.address?.pincode].filter(Boolean).join(", ") || "—"} />
        </div>
      )}

    </div>
  );
};

const ProfileRow = ({ label, value }) => (
  <div className="flex justify-between border-b border-ink-50 pb-2 last:border-0">
    <span className="text-ink-400">{label}</span>
    <span className="font-medium text-ink-900">{value || "—"}</span>
  </div>
);

export default AdminProfilePage;
