import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { serviceService } from "../../api/service.service";
import { bookingService } from "../../api/booking.service";
import { Spinner, ErrorState } from "../../components/ui/States";

const BookServicePage = () => {
  const { serviceId } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    date: "",
    time: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const fetchService = useCallback(() =>
    serviceService
      .getById(serviceId)
      .then((res) => setService(res.data.service))
      .catch((requestError) => {
        setService(null);
        setError(requestError.response?.data?.message || "Service not found.");
      })
      .finally(() => setLoading(false)), [serviceId]);

  const loadService = () => {
    setLoading(true);
    setError("");
    fetchService();
  };

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.time) return toast.error("Select a date and time");

    setSubmitting(true);
    try {
      const scheduledDate = new Date(`${form.date}T${form.time}`);
      const res = await bookingService.create({
        serviceId,
        scheduledDate,
        address: { line1: form.line1, city: form.city, state: form.state, pincode: form.pincode },
      });
      toast.success("Booking created — waiting for worker to accept");
      navigate(`/bookings/${res.data.booking._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Loading..." />;
  if (error || !service) {
    return <div className="mx-auto max-w-xl px-4 py-10"><ErrorState message={error || "Service not found."} onRetry={loadService} /></div>;
  }

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-700">Book Service</h1>
      <div className="card p-4 mt-4 flex items-center justify-between">
        <p className="text-sm font-medium text-ink-900">{service.title}</p>
        <p className="text-sm font-semibold text-ink-900">
          ₹{service.pricing?.amount}/{service.pricing?.type === "hourly" ? "hr" : "day"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Date</label>
            <input type="date" required className="input" placeholder="Select date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Time</label>
            <input type="time" required className="input" placeholder="Select time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Address</label>
          <input required className="input" placeholder="Street / house no." value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input required className="input" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input required className="input" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <input required className="input" placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
        </div>

        <button disabled={submitting} type="submit" className="btn-primary w-full">
          {submitting ? "Booking..." : "Confirm Booking"}
        </button>
      </form>
    </div>
  );
};

export default BookServicePage;
