import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { userService } from "../../api/user.service";
import ServiceCard from "../../components/ServiceCard";
import { Spinner, EmptyState } from "../../components/ui/States";
import { Link } from "react-router-dom";

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState({ services: [], workers: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("services");

  const load = () => {
    userService
      .getFavorites()
      .then((res) => setFavorites(res.data.favorites))
      .catch(() => toast.error("Failed to load favorites"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRemoveWorker = async (workerId) => {
    try {
      await userService.removeFavoriteWorker(workerId);
      load();
    } catch {
      toast.error("Failed to remove");
    }
  };

  const handleRemoveService = async (serviceId) => {
    try {
      await userService.removeFavoriteService(serviceId);
      load();
    } catch {
      toast.error("Failed to remove");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-700">Favorites</h1>

      <div className="mt-5 flex gap-2">
        <button onClick={() => setTab("services")} className={`rounded-full px-3.5 py-1.5 text-xs font-medium border ${tab === "services" ? "bg-ink-900 text-white border-ink-900" : "border-ink-100 text-ink-600"}`}>
          Services
        </button>
        <button onClick={() => setTab("workers")} className={`rounded-full px-3.5 py-1.5 text-xs font-medium border ${tab === "workers" ? "bg-ink-900 text-white border-ink-900" : "border-ink-100 text-ink-600"}`}>
          Workers
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <Spinner label="Loading favorites..." />
        ) : tab === "services" ? (
          favorites.services.length === 0 ? (
            <EmptyState icon={Heart} title="No favorite services." />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.services.map((s) => (
                <div key={s._id} className="min-w-0">
                  <ServiceCard service={s} />
                  <button
                    type="button"
                    onClick={() => handleRemoveService(s._id)}
                    className="mt-2 w-full text-xs font-medium text-rust hover:underline"
                  >
                    Remove from favorites
                  </button>
                </div>
              ))}
            </div>
          )
        ) : favorites.workers.length === 0 ? (
          <EmptyState icon={Heart} title="No favorite workers." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favorites.workers.map((w) => (
              <div key={w._id} className="card p-4 flex items-center justify-between">
                <Link to={`/workers/${w._id}`} className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-denim overflow-hidden flex items-center justify-center text-white font-semibold">
                    {w.avatar?.url ? <img src={w.avatar.url} alt="" className="h-full w-full object-cover" /> : w.name?.charAt(0)}
                  </div>
                  <p className="text-sm font-medium text-ink-900">{w.name}</p>
                </Link>
                <button onClick={() => handleRemoveWorker(w._id)} className="text-xs text-rust hover:underline">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
