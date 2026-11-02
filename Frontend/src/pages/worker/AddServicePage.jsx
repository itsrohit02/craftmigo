import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { X } from "lucide-react";
import { serviceService, categoryService } from "../../api/service.service";
import { Spinner } from "../../components/ui/States";

const AddServicePage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    pricingType: "hourly",
    amount: "",
    durationMinutes: 60,
    tags: "",
  });

  useEffect(() => {
    categoryService.list().then((res) => setCategories(res.data.categories)).catch(() => {});
    if (isEdit) {
      serviceService.getById(id).then((res) => {
        const s = res.data.service;
        setForm({
          title: s.title,
          category: s.category?._id,
          description: s.description,
          pricingType: s.pricing.type,
          amount: s.pricing.amount,
          durationMinutes: s.durationMinutes,
          tags: s.tags?.join(", ") || "",
        });
        setExistingImages(s.images);
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  const handleRemoveExistingImage = async (publicId) => {
    try {
      await serviceService.removeImage(id, publicId);
      setExistingImages((imgs) => imgs.filter((i) => i.publicId !== publicId));
    } catch {
      toast.error("Failed to remove image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      newFiles.forEach((file) => formData.append("images", file));

      if (isEdit) {
        await serviceService.update(id, formData);
        toast.success("Service updated");
      } else {
        await serviceService.create(formData);
        toast.success("Service created");
      }
      navigate("/worker/services");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading service..." />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-700">{isEdit ? "Edit Service" : "Add Service"}</h1>

      <form onSubmit={handleSubmit} className="mt-6 card p-5 space-y-5">
        <div>
          <label className="label">Title</label>
          <input required className="input" placeholder="e.g. Tap and pipe leak repair" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>

        <div>
          <label className="label">Category</label>
          <select required className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea required rows={4} className="input" placeholder="Describe what this service includes" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Pricing Type</label>
            <select className="input" value={form.pricingType} onChange={(e) => setForm({ ...form, pricingType: e.target.value })}>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
          <div>
            <label className="label">Amount (₹)</label>
            <input required type="number" min="0" className="input" placeholder="e.g. 500" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="label">Duration (min)</label>
            <input type="number" min="1" className="input" placeholder="e.g. 60" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Tags (comma separated)</label>
          <input className="input" placeholder="e.g. repair, installation, home" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        </div>

        {isEdit && existingImages.length > 0 && (
          <div>
            <label className="label">Current Images</label>
            <div className="flex flex-wrap gap-2">
              {existingImages.map((img) => (
                <div key={img.publicId} className="relative h-20 w-20">
                  <img src={img.url} alt="" className="h-full w-full object-cover rounded-DEFAULT" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(img.publicId)}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rust text-white"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="label">{isEdit ? "Add More Images" : "Images"}</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setNewFiles(Array.from(e.target.files))}
            className="input"
          />
        </div>

        <button disabled={saving} type="submit" className="btn-primary">
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Service"}
        </button>
      </form>
    </div>
  );
};

export default AddServicePage;
