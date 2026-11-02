import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, MapPin, ShieldCheck, Phone } from "lucide-react";
import { toast } from "sonner";
import { workerService } from "../api/worker.service";
import { userService } from "../api/user.service";
import { serviceService } from "../api/service.service";
import { useAuthStore } from "../store/authStore";
import { Spinner, ErrorState } from "../components/ui/States";
import ServiceCard from "../components/ServiceCard";

const WorkerProfilePage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [servicesError, setServicesError] = useState("");
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const fetchServices = useCallback(() =>
    serviceService
      .getByWorker(id)
      .then((res) => setServices(res.data.services))
      .catch((requestError) => {
        setServices([]);
        setServicesError(requestError.response?.data?.message || "We couldn't load this worker's services.");
      }), [id]);

  const loadServices = () => {
    setServicesError("");
    fetchServices();
  };

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const fetchProfile = useCallback(() =>
    workerService
      .getPublicProfile(id)
      .then((res) => setData(res.data))
      .catch((requestError) => {
        setData(null);
        setError(requestError.response?.data?.message || "Worker not found.");
      })
      .finally(() => setLoading(false)), [id]);

  const loadProfile = () => {
    setLoading(true);
    setError("");
    fetchProfile();
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleBook = (serviceId) => {
    if (!isAuthenticated) {
      return navigate("/login", { state: { from: { pathname: `/book/${serviceId}` } } });
    }
    if (!['user', 'worker'].includes(user?.role)) {
      return toast.error("Only customers and workers can book services");
    }
    navigate(`/book/${serviceId}`);
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) return navigate("/login");
    try {
      await userService.addFavoriteWorker(id);
      toast.success("Added to favorites");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add favorite");
    }
  };

  if (loading) return <Spinner label="Loading worker profile..." />;
  if (error || !data) return <div className="mx-auto max-w-5xl px-4 py-10"><ErrorState message={error || "Worker not found."} onRetry={loadProfile} /></div>;

  const { profile, reviews } = data;
  const phone = profile.user?.phone;
  const isOwnProfile = String(profile.user?._id) === String(user?._id);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <div className="card p-6 flex flex-col sm:flex-row gap-6">
        <div className="h-24 w-24 rounded-full bg-denim overflow-hidden flex items-center justify-center text-white text-2xl font-semibold shrink-0">
          {profile.user?.avatar?.url ? (
            <img src={profile.user.avatar.url} alt="" className="h-full w-full object-cover" />
          ) : (
            profile.user?.name?.charAt(0)
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-700">{profile.user?.name}</h1>
            {profile.verificationStatus === "verified" && (
              <span className="badge bg-moss-light text-moss">
                <ShieldCheck size={13} /> Verified
              </span>
            )}
            <span className={`badge ${profile.isAvailable ? "bg-moss-light text-moss" : "bg-ink-50 text-ink-400"}`}>
              {profile.isAvailable ? "Available now" : "Unavailable"}
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-ink-600">
            <Star size={14} className="fill-amber text-amber" /> {profile.ratingAverage?.toFixed(1) || "New"} (
            {profile.ratingCount || 0} reviews) · {profile.experienceYears || 0} yrs experience
          </p>
          {profile.serviceAreas?.length > 0 && (
            <p className="mt-1 flex items-center gap-1 text-sm text-ink-400">
              <MapPin size={14} /> {profile.serviceAreas.join(", ")}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {phone && (
              <a href={`tel:${phone}`} className="btn-outline gap-2">
                <Phone size={15} /> Call
              </a>
            )}
            <button onClick={handleFavorite} className="btn-ghost">
              Add to Favorites
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-lg font-700">About</h2>
            <p className="mt-2 text-sm text-ink-600 leading-relaxed">{profile.bio || "No bio provided yet."}</p>
          </section>

          {(servicesError || services.length > 0) && (
            <section>
              <h2 className="text-lg font-700">Services Offered</h2>
              {servicesError ? (
                <div className="mt-3"><ErrorState message={servicesError} onRetry={loadServices} /></div>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {services.map((s) => (
                  <div key={s._id} className="flex min-w-0 flex-col">
                    <ServiceCard service={s} />
                    {!isOwnProfile && (!isAuthenticated || ['user', 'worker'].includes(user?.role)) && (
                      <button type="button" onClick={() => handleBook(s._id)} className="btn-primary mt-2 w-full">
                        Book now
                      </button>
                    )}
                  </div>
                ))}
                </div>
              )}
            </section>
          )}

          {profile.skills?.length > 0 && (
            <section>
              <h2 className="text-lg font-700">Skills</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <span key={s} className="rounded-sm bg-ink-50 px-2.5 py-1 text-xs text-ink-600">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {profile.portfolio?.length > 0 && (
            <section>
              <h2 className="text-lg font-700">Portfolio</h2>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {profile.portfolio.map((item) => (
                  <div key={item._id} className="aspect-square rounded-DEFAULT overflow-hidden bg-ink-50">
                    <img src={item.url} alt={item.caption} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-700">Reviews ({reviews?.length || 0})</h2>
            <div className="mt-3 space-y-4">
              {reviews?.length === 0 && <p className="text-sm text-ink-400">No reviews yet.</p>}
              {reviews?.map((r) => (
                <div key={r._id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink-900">{r.customer?.name}</p>
                    <span className="flex items-center gap-1 text-xs text-ink-600">
                      <Star size={12} className="fill-amber text-amber" /> {r.rating}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-400">{r.service?.title}</p>
                  {r.comment && <p className="mt-2 text-sm text-ink-600">{r.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div>
          <h2 className="text-lg font-700">Categories</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.categories?.map((c) => (
              <span key={c._id} className="rounded-sm bg-amber-light px-2.5 py-1 text-xs text-amber-dark">
                {c.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfilePage;
