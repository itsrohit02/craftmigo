import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ClipboardList, Wallet, Star, ShieldCheck } from "lucide-react";
import { workerService } from "../../api/worker.service";
import { bookingService } from "../../api/booking.service";
import StatusBadge from "../../components/ui/StatusBadge";
import { Spinner, EmptyState } from "../../components/ui/States";

const WorkerDashboardPage = () => {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const load = () => {
    Promise.all([workerService.getMyProfile(), bookingService.getWorkerBookings({ status: "pending" })])
      .then(([profileRes, bookingsRes]) => {
        setProfile(profileRes.data.profile);
        setRequests(bookingsRes.data.bookings.slice(0, 5));
      })
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const res = await workerService.toggleAvailability();
      setProfile((p) => ({ ...p, isAvailable: res.data.isAvailable }));
      toast.success(res.data.isAvailable ? "You're now available" : "You're now unavailable");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update availability");
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <Spinner label="Loading dashboard..." />;
  if (!profile) return null;

  if (!profile.isSetupComplete) {
    return (
      <EmptyState
        title="Complete your profile setup"
        description="Finish setting up your worker profile before accessing your dashboard."
        action={<Link to="/worker/setup" className="btn-primary mt-2">Complete Setup</Link>}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-700">Worker Dashboard</h1>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`btn ${profile.isAvailable ? "bg-moss text-white" : "bg-red-500 text-white"}`}
        >
          {profile.isAvailable ? "Available: ON" : "Available: OFF"}
        </button>
      </div>

      {profile.verificationStatus !== "verified" && (
        <div className="mt-5 card p-4 bg-amber-light border-amber flex items-center gap-3">
          <ShieldCheck className="text-amber-dark shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink-900">
              {profile.verificationStatus === "pending" ? "Verification pending review" : "Verification required"}
            </p>
            <p className="text-xs text-ink-600">You must be verified before you can create services.</p>
          </div>
          {profile.verificationStatus !== "pending" && (
            <Link to="/worker/verification" className="btn-outline shrink-0">Submit</Link>
          )}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Star} label="Rating" value={profile.ratingAverage?.toFixed(1) || "New"} />
        <StatCard icon={ClipboardList} label="Reviews" value={profile.ratingCount || 0} />
        <StatCard icon={Wallet} label="Earnings" value={`₹${profile.totalEarnings || 0}`} />
        <StatCard icon={ClipboardList} label="Pending Requests" value={requests.length} />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-700">New Booking Requests</h2>
          <Link to="/worker/requests" className="text-sm font-medium text-denim hover:underline">View all</Link>
        </div>
        <div className="mt-4">
          {requests.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No booking requests yet." />
          ) : (
            <div className="space-y-3">
              {requests.map((b) => (
                <Link key={b._id} to={`/bookings/${b._id}`} className="card p-4 flex items-center justify-between hover:border-ink-400 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{b.service?.title}</p>
                    <p className="text-xs text-ink-400">{b.customer?.name} · {new Date(b.scheduledDate).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="card p-4">
    <Icon size={17} className="text-amber-dark" />
    <p className="mt-2 text-lg font-700 text-ink-900">{value}</p>
    <p className="text-xs text-ink-400">{label}</p>
  </div>
);

export default WorkerDashboardPage;
