import { useEffect, useState } from "react";
import { Users, Briefcase, CalendarCheck, Wallet, ShieldAlert, CheckCircle2 } from "lucide-react";
import { adminService } from "../../api/misc.service";
import { Spinner, ErrorState } from "../../components/ui/States";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = () =>
    adminService
      .getDashboard()
      .then((res) => setStats(res.data))
      .catch((requestError) => {
        setStats(null);
        setError(requestError.response?.data?.message || "We couldn't load the admin dashboard.");
      })
      .finally(() => setLoading(false));

  const load = () => {
    setLoading(true);
    setError("");
    fetchDashboard();
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <Spinner label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!stats) return <ErrorState onRetry={load} />;

  const cards = [
    { icon: Users, label: "Customers", value: stats.totalUsers },
    { icon: Briefcase, label: "Workers", value: stats.totalWorkers },
    { icon: CalendarCheck, label: "Total Bookings", value: stats.totalBookings },
    { icon: CheckCircle2, label: "Completed", value: stats.completedBookings },
    { icon: Wallet, label: "Total Revenue", value: `₹${stats.totalRevenue}` },
    { icon: ShieldAlert, label: "Pending Verifications", value: stats.pendingVerifications },
  ];

  return (
    <div>
      <h1 className="text-2xl font-700">Admin Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <c.icon size={18} className="text-amber-dark" />
            <p className="mt-2 text-xl font-700 text-ink-900">{c.value}</p>
            <p className="text-xs text-ink-400">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
