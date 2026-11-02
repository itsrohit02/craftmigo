import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck } from "lucide-react";
import { bookingService } from "../../api/booking.service";
import StatusBadge from "../../components/ui/StatusBadge";
import { Spinner, EmptyState } from "../../components/ui/States";

const TABS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "paid", label: "Paid" },
  { key: "cancelled", label: "Cancelled" },
];

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("");

  useEffect(() => {
    bookingService
      .getCustomerBookings(tab ? { status: tab } : {})
      .then((res) => setBookings(res.data.bookings))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div>
      <h1 className="text-2xl font-700">My Bookings</h1>

      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              if (tab !== t.key) setLoading(true);
              setTab(t.key);
            }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
              tab === t.key ? "bg-ink-900 text-white border-ink-900" : "border-ink-100 text-ink-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <Spinner label="Loading bookings..." />
        ) : bookings.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No bookings yet." />
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <Link
                key={b._id}
                to={`/bookings/${b._id}`}
                className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-ink-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-DEFAULT overflow-hidden bg-ink-50 shrink-0">
                    {b.service?.images?.[0]?.url && (
                      <img src={b.service.images[0].url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{b.service?.title}</p>
                    <p className="text-xs text-ink-400">
                      {b.bookingCode} · {b.worker?.name} · {new Date(b.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-sm font-semibold text-ink-900">₹{b.price}</p>
                  <StatusBadge status={b.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;
