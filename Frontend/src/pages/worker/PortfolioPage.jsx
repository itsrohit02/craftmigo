import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, X, Image as ImageIcon } from "lucide-react";
import { workerService } from "../../api/worker.service";
import { Spinner, EmptyState } from "../../components/ui/States";

const PortfolioPage = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = () => {
    workerService
      .getMyProfile()
      .then((res) => setPortfolio(res.data.profile.portfolio || []))
      .catch(() => toast.error("Failed to load portfolio"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      await workerService.addPortfolioItem(formData);
      toast.success("Photo added");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await workerService.removePortfolioItem(itemId);
      setPortfolio((p) => p.filter((i) => i._id !== itemId));
    } catch {
      toast.error("Failed to remove");
    }
  };

  if (loading) return <Spinner label="Loading portfolio..." />;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-700">Portfolio</h1>
        <button onClick={() => fileRef.current.click()} disabled={uploading} className="btn-primary gap-2">
          <Plus size={16} /> {uploading ? "Uploading..." : "Add Photo"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      <div className="mt-6">
        {portfolio.length === 0 ? (
          <EmptyState icon={ImageIcon} title="No portfolio photos yet" description="Add photos of your past work to build customer trust." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {portfolio.map((item) => (
              <div key={item._id} className="relative aspect-square rounded-lg overflow-hidden bg-ink-50 group">
                <img src={item.url} alt={item.caption} className="h-full w-full object-cover" />
                <button
                  onClick={() => handleRemove(item._id)}
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;
