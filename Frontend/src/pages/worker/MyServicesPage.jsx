import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Briefcase, Trash2 } from "lucide-react";
import { serviceService } from "../../api/service.service";
import { Spinner, EmptyState } from "../../components/ui/States";

const MyServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    serviceService
      .getMine()
      .then((res) => setServices(res.data.services))
      .catch(() => toast.error("Failed to load services"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleToggleActive = async (id) => {
    try {
      await serviceService.toggleActive(id);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this service? This cannot be undone.")) return;
    try {
      await serviceService.remove(id);
      toast.success("Service deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-700">My Services</h1>
        <Link to="/worker/services/new" className="btn-primary gap-2">
          <Plus size={16} /> Add Service
        </Link>
      </div>

      <div className="mt-6">
        {loading ? (
          <Spinner label="Loading services..." />
        ) : services.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No services yet"
            description="Create your first service so customers can find and book you."
            action={<Link to="/worker/services/new" className="btn-primary mt-2">Add Service</Link>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => (
              <div key={s._id} className="card overflow-hidden">
                <div className="aspect-video bg-ink-50">
                  {s.images?.[0]?.url && <img src={s.images[0].url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink-900 line-clamp-1">{s.title}</p>
                    <span className={`badge ${s.isActive ? "bg-moss-light text-moss" : "bg-ink-50 text-ink-400"}`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-400">{s.category?.name}</p>
                  <p className="mt-2 text-sm font-semibold text-ink-900">
                    ₹{s.pricing?.amount}/{s.pricing?.type === "hourly" ? "hr" : "day"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link to={`/worker/services/${s._id}/edit`} className="btn-outline flex-1 text-xs py-2">
                      Edit
                    </Link>
                    <button onClick={() => handleToggleActive(s._id)} className="btn-outline flex-1 text-xs py-2">
                      {s.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => handleDelete(s._id)} className="btn-outline text-rust px-2.5 py-2">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyServicesPage;
