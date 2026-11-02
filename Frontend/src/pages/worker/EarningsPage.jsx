import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { bookingService } from "../../api/booking.service";
import { workerService } from "../../api/worker.service";
import { Spinner, EmptyState } from "../../components/ui/States";

const EarningsPage = () => {
  const [profile, setProfile] = useState(null);
  const [paidBookings, setPaidBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([workerService.getMyProfile(), bookingService.getWorkerBookings({ status: "paid" })])
      .then(([profileRes, bookingsRes]) => {
        setProfile(profileRes.data.profile);
        setPaidBookings(bookingsRes.data.bookings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading earnings..." />;

  return (
    <div>
      <h1 className="text-2xl font-700">Earnings</h1>

      <div className="mt-6 card p-6 bg-ink-900 text-white">
        <p className="text-sm text-white/60">Total Earnings</p>
        <p className="mt-1 text-3xl font-700">₹{profile?.totalEarnings || 0}</p>
      </div>

      <h2 className="mt-8 text-lg font-700">Paid Bookings</h2>
      <div className="mt-4">
        {paidBookings.length === 0 ? (
          <EmptyState icon={Wallet} title="No paid bookings yet." />
        ) : (
          <div className="space-y-3">
            {paidBookings.map((b) => (
              <div key={b._id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{b.service?.title}</p>
                  <p className="text-xs text-ink-400">{b.customer?.name} · {new Date(b.paidAt || b.updatedAt).toLocaleDateString()}</p>
                </div>
                <p className="text-sm font-semibold text-moss">+₹{b.price}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EarningsPage;
