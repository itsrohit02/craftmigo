import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Phone, MessageSquare, MapPin } from "lucide-react";
import { toast } from "sonner";
import { bookingService } from "../api/booking.service";
import { messageService } from "../api/misc.service";
import { useAuthStore } from "../store/authStore";
import StatusBadge from "../components/ui/StatusBadge";
import BookingTimeline from "../components/ui/BookingTimeline";
import { Spinner, ErrorState } from "../components/ui/States";

const BookingDetailsPage = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const isBookingWorker = booking && String(booking.worker?._id) === String(user?._id);
  const isBookingCustomer = booking && String(booking.customer?._id) === String(user?._id);
  const otherParty = booking ? (isBookingWorker ? booking.customer : isBookingCustomer ? booking.worker : null) : null;

  const loadBooking = () => {
    setLoading(true);
    setError("");
    bookingService
      .getById(id)
      .then((res) => setBooking(res.data.booking))
      .catch((requestError) => {
        setBooking(null);
        setError(requestError.response?.data?.message || "Booking not found.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const runAction = async (action, successMsg) => {
    setActionLoading(true);
    try {
      await action();
      toast.success(successMsg);
      loadBooking();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessage = async () => {
    try {
      const res = await messageService.startConversation(otherParty._id, booking._id);
      navigate(`/messages/${res.data.conversation._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not open chat");
    }
  };

  if (loading) return <Spinner label="Loading booking..." />;
  if (error || !booking) return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorState message={error || "Booking not found."} onRetry={loadBooking} /></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs text-ink-400">{booking.bookingCode}</p>
          <h1 className="text-xl font-700">{booking.service?.title}</h1>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="card p-5 mt-6 overflow-x-auto">
        <BookingTimeline status={booking.status} />
      </div>

      <div className="card p-5 mt-5">
        <p className="text-sm font-semibold text-ink-900">{isBookingWorker ? "Customer" : "Worker"}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-denim overflow-hidden flex items-center justify-center text-white font-semibold shrink-0">
              {otherParty?.avatar?.url ? (
                <img src={otherParty.avatar.url} alt="" className="h-full w-full object-cover" />
              ) : (
                otherParty?.name?.charAt(0)
              )}
            </div>
            <p className="text-sm font-medium text-ink-900">{otherParty?.name}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleMessage} className="btn-outline gap-2">
              <MessageSquare size={15} /> Message
            </button>
            {otherParty?.phone && (
              <a href={`tel:${otherParty.phone}`} className="btn-outline gap-2">
                <Phone size={15} /> Call
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="card p-5 mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-ink-400 text-xs">Scheduled</p>
          <p className="font-medium text-ink-900">{new Date(booking.scheduledDate).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-ink-400 text-xs">Price</p>
          <p className="font-medium text-ink-900">₹{booking.price} ({booking.pricingType})</p>
        </div>
        <div className="col-span-2">
          <p className="text-ink-400 text-xs flex items-center gap-1"><MapPin size={12}/> Address</p>
          <p className="font-medium text-ink-900">
            {[booking.address?.line1, booking.address?.city, booking.address?.state, booking.address?.pincode]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
      </div>

      {/* Worker actions */}
      {isBookingWorker && (
        <div className="mt-6 flex flex-wrap gap-3">
          {booking.status === "pending" && (
            <>
              <button disabled={actionLoading} onClick={() => runAction(() => bookingService.accept(id), "Booking accepted")} className="btn-primary">
                Accept
              </button>
              <button disabled={actionLoading} onClick={() => runAction(() => bookingService.reject(id), "Booking rejected")} className="btn-outline text-rust">
                Reject
              </button>
            </>
          )}
          {booking.status === "accepted" && (
            <button disabled={actionLoading} onClick={() => runAction(() => bookingService.markOnTheWay(id), "Marked on the way")} className="btn-primary">
              Mark On The Way
            </button>
          )}
          {booking.status === "on_the_way" && (
            <button disabled={actionLoading} onClick={() => runAction(() => bookingService.start(id), "Service started")} className="btn-primary">
              Start Job
            </button>
          )}
          {booking.status === "started" && (
            <button disabled={actionLoading} onClick={() => runAction(() => bookingService.complete(id), "Service marked complete")} className="btn-primary">
              Complete Job
            </button>
          )}
        </div>
      )}

      {/* Customer actions */}
      {isBookingCustomer && (
        <div className="mt-6 flex flex-wrap gap-3">
          {booking.status === "pending" && (
            <button disabled={actionLoading} onClick={() => runAction(() => bookingService.cancel(id), "Booking cancelled")} className="btn-outline text-rust">
              Cancel Booking
            </button>
          )}
          {booking.status === "completed" && (
            <button disabled={actionLoading} onClick={() => runAction(() => bookingService.pay(id), "Payment recorded")} className="btn-primary">
              Complete Demo Payment
            </button>
          )}
          {booking.status === "paid" && !booking.hasReview && (
            <Link to={`/bookings/${id}/review`} className="btn-primary">
              Leave a Review
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingDetailsPage;
