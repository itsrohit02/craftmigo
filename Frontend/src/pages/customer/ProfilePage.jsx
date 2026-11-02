import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { userService } from "../../api/user.service";

const CustomerProfilePage = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
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

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await userService.updateProfile(form);
      setUser(res.data.user);
      toast.success("Profile updated");
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const res = await userService.updateAvatar(formData);
      setUser(res.data.user);
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-700">My Profile</h1>

      <div className="mt-6 flex items-center gap-5">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-denim overflow-hidden flex items-center justify-center text-white text-xl font-semibold">
            {user?.avatar?.url ? (
              <img src={user.avatar.url} alt="" className="h-full w-full object-cover" />
            ) : (
              user?.name?.charAt(0)
            )}
          </div>
          <button
            onClick={() => fileRef.current.click()}
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-amber text-ink-900 shadow"
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

      {!editing ? (
        <div className="mt-8 card p-5 space-y-3 text-sm">
          <Row label="Phone" value={user?.phone} />
          <Row label="Address" value={[user?.address?.line1, user?.address?.city, user?.address?.state, user?.address?.pincode].filter(Boolean).join(", ") || "—"} />
          <div className="mt-3 flex gap-3">
            <button onClick={() => setEditing(true)} className="btn-outline">Edit</button>
            <button onClick={() => navigate("/change-password")} className="btn-outline">Change password</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="mt-8 card p-5 space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" placeholder="Enter your full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" placeholder="Enter your phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="col-span-2">
              <label className="label">Address Line</label>
              <input className="input" placeholder="House number and street" value={form.address.line1} onChange={(e) => setForm({ ...form, address: { ...form.address, line1: e.target.value } })} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" placeholder="City" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" placeholder="State" value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} />
            </div>
            <div>
              <label className="label">Pincode</label>
              <input className="input" placeholder="Pincode" value={form.address.pincode} onChange={(e) => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })} />
            </div>
          </div>
          <div className="flex gap-3">
            <button disabled={loading} type="submit" className="btn-primary">{loading ? "Saving..." : "Save"}</button>
            <button type="button" onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between border-b border-ink-50 pb-2 last:border-0">
    <span className="text-ink-400">{label}</span>
    <span className="font-medium text-ink-900">{value || "—"}</span>
  </div>
);

export default CustomerProfilePage;
