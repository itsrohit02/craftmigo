import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";
import { bookingService } from "../../api/booking.service";
import { Spinner, EmptyState } from "../../components/ui/States";

const BookingRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    bookingService
      .getWorkerBookings({ status: "pending" })
      .then((res) => setRequests(res.data.bookings))
      .catch(() => toast.error("Failed to load requests"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAccept = async (id) => {
    setActingId(id);
    try {
      await bookingService.accept(id);
      toast.success("Booking accepted");
      navigate("/worker/bookings?status=accepted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept");
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id) => {
    setActingId(id);
    try {
      await bookingService.reject(id);
      toast.success("Booking rejected");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-700">Booking Requests</h1>

      <div className="mt-6">
        {loading ? (
          <Spinner label="Loading requests..." />
        ) : requests.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No booking requests right now." />
        ) : (
          <div className="space-y-4">
            {requests.map((b) => (
              <div key={b._id} className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <Link to={`/bookings/${b._id}`} className="text-sm font-semibold text-ink-900 hover:underline">
                    {b.service?.title}
                  </Link>
                  <p className="text-xs text-ink-400 mt-1">
                    {b.customer?.name} · {new Date(b.scheduledDate).toLocaleString()} · ₹{b.price}
                  </p>
                  <p className="text-xs text-ink-400">
                    {[b.address?.line1, b.address?.city].filter(Boolean).join(", ")}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    disabled={actingId === b._id}
                    onClick={() => handleAccept(b._id)}
                    className="btn-primary"
                  >
                    Accept
                  </button>
                  <button
                    disabled={actingId === b._id}
                    onClick={() => handleReject(b._id)}
                    className="btn-outline text-rust"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingRequestsPage;
