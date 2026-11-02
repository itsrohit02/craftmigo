import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { workerService } from "../../api/worker.service";
import { categoryService } from "../../api/service.service";

const WorkerSetupPage = () => {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const navigate = useNavigate();
  const [form, setForm] = useState({
    bio: "",
    skills: "",
    serviceAreas: "",
    experienceYears: "",
    categories: [],
  });

  useEffect(() => {
    categoryService
      .list()
      .then((res) => setCategories(res.data.categories))
      .catch(() => setCategoriesError(true))
      .finally(() => setCategoriesLoading(false));
  }, []);

  const toggleCategory = (id) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(id) ? f.categories.filter((c) => c !== id) : [...f.categories, id],
    }));
  };

  const otherCategory = categories.find((category) => category.slug === "other");
  const hasOtherCategory = otherCategory && form.categories.includes(otherCategory._id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.categories.length === 0) return toast.error("Select at least one category");
    if (hasOtherCategory && !customCategory.trim()) return toast.error("Enter your category");

    setLoading(true);
    try {
      await workerService.updateMyProfile({
        bio: form.bio,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        serviceAreas: form.serviceAreas.split(",").map((s) => s.trim()).filter(Boolean),
        experienceYears: Number(form.experienceYears) || 0,
        categories: form.categories,
        customCategory: hasOtherCategory ? customCategory.trim() : "",
      });
      toast.success("Profile set up! Submit verification next to start creating services.");
      navigate("/worker/verification");
    } catch (err) {
      toast.error(err.response?.data?.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-700">Set up your worker profile</h1>
      <p className="mt-1 text-sm text-ink-400">
        This info is shown to customers when they search for services in your trade.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="label">Bio</label>
          <textarea
            rows={3}
            required
            className="input"
            placeholder="Tell customers about your experience..."
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Categories</label>
          <div className="flex flex-wrap gap-2">
            {categoriesLoading && <p className="text-xs text-ink-400">Loading categories...</p>}
            {!categoriesLoading && categories.map((c) => (
              <button
                type="button"
                key={c._id}
                onClick={() => toggleCategory(c._id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                  form.categories.includes(c._id) ? "bg-ink-900 text-white border-ink-900" : "border-ink-100 text-ink-600"
                }`}
              >
                {c.name}
              </button>
            ))}
            {!categoriesLoading && categoriesError && (
              <p className="text-xs text-rust">Could not load categories. Please refresh and try again.</p>
            )}
            {!categoriesLoading && !categoriesError && categories.length === 0 && (
              <p className="text-xs text-ink-400">No categories available yet.</p>
            )}
          </div>
          {hasOtherCategory && (
            <input
              required
              className="input mt-3"
              placeholder="Enter your category, e.g. engineer, designer, craftsperson"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
            />
          )}
        </div>

        <div>
          <label className="label">Skills (comma separated)</label>
          <input required className="input" placeholder="e.g. pipe fitting, leak repair" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
        </div>

        <div>
          <label className="label">Service areas (comma separated)</label>
          <input required className="input" placeholder="e.g. Vaishali Nagar, Malviya Nagar" value={form.serviceAreas} onChange={(e) => setForm({ ...form, serviceAreas: e.target.value })} />
        </div>

        <div>
          <label className="label">Years of experience</label>
          <input type="number" min="0" className="input" placeholder="e.g. 5" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} />
        </div>

        <button disabled={loading} type="submit" className="btn-primary w-full">
          {loading ? "Saving..." : "Save & Continue"}
        </button>
      </form>
    </div>
  );
};

export default WorkerSetupPage;
