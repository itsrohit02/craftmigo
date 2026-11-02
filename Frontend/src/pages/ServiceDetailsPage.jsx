import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Star, Clock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { serviceService } from "../api/service.service";
import { userService } from "../api/user.service";
import { useAuthStore } from "../store/authStore";
import { Spinner, ErrorState } from "../components/ui/States";

const ServiceDetailsPage = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const fetchService = useCallback(() =>
    serviceService
      .getById(id)
      .then((res) => setService(res.data.service))
      .catch((requestError) => {
        setService(null);
        setError(requestError.response?.data?.message || "Service not found.");
      })
      .finally(() => setLoading(false)), [id]);

  const loadService = () => {
    setLoading(true);
    setError("");
    fetchService();
  };

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  const handleFavorite = async () => {
    if (!isAuthenticated) return navigate("/login");
    try {
      await userService.addFavoriteService(id);
      toast.success("Added to favorites");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add favorite");
    }
  };

  const handleBook = () => {
    if (!isAuthenticated) return navigate("/login");
    if (String(service.worker?._id) === String(user?._id)) return toast.error("You cannot book your own service");
    if (!['user', 'worker'].includes(user?.role)) return toast.error("Only customers and workers can book services");
    navigate(`/book/${id}`);
  };

  if (loading) return <Spinner label="Loading service..." />;
  if (error || !service) return <div className="mx-auto max-w-6xl px-4 py-10"><ErrorState message={error || "Service not found."} onRetry={loadService} /></div>;
  const isOwnService = String(service.worker?._id) === String(user?._id);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="aspect-video rounded-lg overflow-hidden bg-ink-50">
          {service.images?.length > 0 ? (
            <img src={service.images[activeImage]?.url} alt={service.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-ink-400 text-sm">No image available</div>
          )}
        </div>
        {service.images?.length > 1 && (
          <div className="mt-3 flex gap-2">
            {service.images.map((img, idx) => (
              <button
                key={img.publicId}
                onClick={() => setActiveImage(idx)}
                className={`h-16 w-16 rounded-DEFAULT overflow-hidden border-2 ${
                  activeImage === idx ? "border-amber" : "border-transparent"
                }`}
              >
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <p className="mt-6 text-xs font-medium text-amber-dark">{service.category?.name}</p>
        <h1 className="mt-1 text-2xl font-700">{service.title}</h1>

        <div className="mt-3 flex items-center gap-4 text-sm text-ink-600">
          <span className="flex items-center gap-1">
            <Star size={15} className="fill-amber text-amber" />
            {service.ratingAverage?.toFixed(1) || "New"} ({service.ratingCount || 0} reviews)
          </span>
          <span className="flex items-center gap-1">
            <Clock size={15} /> {service.durationMinutes} min
          </span>
        </div>

        <p className="mt-6 text-sm text-ink-600 leading-relaxed whitespace-pre-line">{service.description}</p>

        {service.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {service.tags.map((tag) => (
              <span key={tag} className="rounded-sm bg-ink-50 px-2.5 py-1 text-xs text-ink-600">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="card p-5 sticky top-24">
          <p className="text-2xl font-700 text-ink-900">
            ₹{service.pricing?.amount}
            <span className="text-sm font-normal text-ink-400">
              /{service.pricing?.type === "hourly" ? "hour" : "day"}
            </span>
          </p>

          {!isOwnService && (!isAuthenticated || ['user', 'worker'].includes(user?.role)) && (
            <button onClick={handleBook} className="btn-primary w-full mt-4">
              Book This Service
            </button>
          )}
          <button onClick={handleFavorite} className="btn-outline w-full mt-2">
            Add to Favorites
          </button>

          <div className="mt-5 pt-5 border-t border-ink-100">
            <Link to={`/workers/${service.worker?._id}`} className="flex items-center gap-3 group">
              <div className="h-11 w-11 rounded-full bg-denim overflow-hidden flex items-center justify-center text-white font-semibold shrink-0">
                {service.worker?.avatar?.url ? (
                  <img src={service.worker.avatar.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  service.worker?.name?.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900 group-hover:underline truncate">
                  {service.worker?.name}
                </p>
                <p className="text-xs text-ink-400 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-moss" /> View profile
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailsPage;
