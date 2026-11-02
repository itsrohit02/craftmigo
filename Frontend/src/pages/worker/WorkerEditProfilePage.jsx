import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { workerService } from "../../api/worker.service";
import { userService } from "../../api/user.service";
import { categoryService } from "../../api/service.service";
import { useAuthStore } from "../../store/authStore";
import { Spinner } from "../../components/ui/States";

const WorkerEditProfilePage = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const [form, setForm] = useState(null);

  useEffect(() => {
    Promise.all([workerService.getMyProfile(), categoryService.list()])
      .then(([profileRes, catRes]) => {
        const p = profileRes.data.profile;
        setProfile(p);
        setCategories(catRes.data.categories);
        setForm({
          name: p.user?.name || "",
          phone: p.user?.phone || "",
          bio: p.bio || "",
          skills: p.skills?.join(", ") || "",
          serviceAreas: p.serviceAreas?.join(", ") || "",
          experienceYears: p.experienceYears || 0,
          categories: p.categories?.map((c) => c._id) || [],
        });
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const toggleCategory = (id) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(id) ? f.categories.filter((c) => c !== id) : [...f.categories, id],
    }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await workerService.updateMyProfile({
        ...form,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        serviceAreas: form.serviceAreas.split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <Spinner label="Loading profile..." />;

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-700">Worker Profile</h1>
        <div className="flex gap-3">
          <button type="button" onClick={() => setEditing((value) => !value)} className="btn-outline">
            {editing ? "Cancel" : "Edit"}
          </button>
          <button type="button" onClick={() => navigate("/change-password")} className="btn-outline">Change password</button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-5">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-denim overflow-hidden flex items-center justify-center text-white text-xl font-semibold">
            {user?.avatar?.url ? <img src={user.avatar.url} alt="" className="h-full w-full object-cover" /> : user?.name?.charAt(0)}
          </div>
          <button onClick={() => fileRef.current.click()} className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-amber text-ink-900 shadow">
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
        <form onSubmit={handleSubmit} className="mt-8 card p-5 space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input disabled={!editing} className="input" placeholder="Enter your full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input disabled={!editing} className="input" placeholder="Enter your phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Bio</label>
          <textarea disabled={!editing} rows={3} className="input" placeholder="Tell customers about your experience" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>

        <div>
          <label className="label">Categories</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                type="button"
                key={c._id}
                onClick={() => toggleCategory(c._id)}
                disabled={!editing}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                  form.categories.includes(c._id) ? "bg-ink-900 text-white border-ink-900" : "border-ink-100 text-ink-600"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Skills (comma separated)</label>
          <input disabled={!editing} className="input" placeholder="e.g. pipe fitting, leak repair" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
        </div>
        <div>
          <label className="label">Service areas (comma separated)</label>
          <input disabled={!editing} className="input" placeholder="e.g. Vaishali Nagar, Malviya Nagar" value={form.serviceAreas} onChange={(e) => setForm({ ...form, serviceAreas: e.target.value })} />
        </div>
        <div>
          <label className="label">Years of experience</label>
          <input disabled={!editing} type="number" min="0" className="input" placeholder="e.g. 5" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} />
        </div>

        <button disabled={saving || !editing} type="submit" className="btn-primary">
          {saving ? "Saving..." : "Save Changes"}
        </button>
        </form>
      ) : (
        <div className="mt-8 card space-y-4 p-5 text-sm">
          <ProfileRow label="Phone" value={user?.phone} />
          <ProfileRow label="Bio" value={profile.bio} />
          <ProfileRow label="Categories" value={profile.categories?.map((category) => category.name).join(", ")} />
          <ProfileRow label="Skills" value={profile.skills?.join(", ")} />
          <ProfileRow label="Service areas" value={profile.serviceAreas?.join(", ")} />
          <ProfileRow label="Experience" value={`${profile.experienceYears || 0} years`} />
        </div>
      )}

    </div>
  );
};

const ProfileRow = ({ label, value }) => (
  <div className="flex flex-col gap-1 border-b border-ink-50 pb-3 last:border-0 sm:flex-row sm:justify-between">
    <span className="text-ink-400">{label}</span>
    <span className="font-medium text-ink-900 sm:text-right">{value || "—"}</span>
  </div>
);

export default WorkerEditProfilePage;
