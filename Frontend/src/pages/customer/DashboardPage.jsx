import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Heart, Search } from "lucide-react";
import { bookingService } from "../../api/booking.service";
import StatusBadge from "../../components/ui/StatusBadge";
import { Spinner, EmptyState } from "../../components/ui/States";
import { useAuthStore } from "../../store/authStore";

const CustomerDashboardPage = () => {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingService
      .getCustomerBookings()
      .then((res) => setBookings(res.data.bookings.slice(0, 5)))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-700">Hi, {user?.name?.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-ink-400">Here's what's happening with your bookings.</p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/services" className="card p-5 flex items-center gap-4 hover:border-ink-400 transition-colors">
          <div className="flex h-11 w-11 items-center justify-center rounded-DEFAULT bg-amber-light text-amber-dark">
            <Search size={19} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">Browse Services</p>
            <p className="text-xs text-ink-400">Find a worker for your next job</p>
          </div>
        </Link>
        <Link to="/dashboard/favorites" className="card p-5 flex items-center gap-4 hover:border-ink-400 transition-colors">
          <div className="flex h-11 w-11 items-center justify-center rounded-DEFAULT bg-denim/10 text-denim">
            <Heart size={19} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">Favorites</p>
            <p className="text-xs text-ink-400">Your saved services & workers</p>
          </div>
        </Link>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-700">Recent Bookings</h2>
          <Link to="/dashboard/bookings" className="text-sm font-medium text-denim hover:underline">
            View all
          </Link>
        </div>

        <div className="mt-4">
          {loading ? (
            <Spinner label="Loading bookings..." />
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No bookings yet"
              description="Book your first service to see it here."
              action={
                <Link to="/services" className="btn-primary mt-2">
                  Browse Services
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <Link key={b._id} to={`/bookings/${b._id}`} className="card p-4 flex items-center justify-between hover:border-ink-400 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{b.service?.title}</p>
                    <p className="text-xs text-ink-400">{b.bookingCode} · {b.worker?.name}</p>
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

export default CustomerDashboardPage;
