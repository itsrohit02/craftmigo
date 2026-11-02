import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { CalendarCheck } from "lucide-react";
import { bookingService } from "../../api/booking.service";
import StatusBadge from "../../components/ui/StatusBadge";
import { Spinner, EmptyState } from "../../components/ui/States";

const TABS = [
  { key: "", label: "All" },
  { key: "accepted", label: "Accepted" },
  { key: "on_the_way", label: "On The Way" },
  { key: "started", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "paid", label: "Paid" },
];

const WorkerBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedStatus = searchParams.get("status") || "";
  const tab = TABS.some((item) => item.key === requestedStatus) ? requestedStatus : "";

  useEffect(() => {
    bookingService
      .getWorkerBookings(tab ? { status: tab } : {})
      .then((res) => setBookings(res.data.bookings))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [tab]);

  const selectTab = (nextTab) => {
    if (nextTab === tab) return;
    setLoading(true);
    const nextParams = new URLSearchParams(searchParams);
    if (nextTab) nextParams.set("status", nextTab);
    else nextParams.delete("status");
    setSearchParams(nextParams);
  };

  return (
    <div>
      <h1 className="text-2xl font-700">Bookings</h1>

      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => selectTab(t.key)}
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
          <EmptyState icon={CalendarCheck} title="No bookings in this category." />
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <Link key={b._id} to={`/bookings/${b._id}`} className="card p-4 flex items-center justify-between hover:border-ink-400 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{b.service?.title}</p>
                  <p className="text-xs text-ink-400">{b.customer?.name} · {new Date(b.scheduledDate).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
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

export default WorkerBookingsPage;
