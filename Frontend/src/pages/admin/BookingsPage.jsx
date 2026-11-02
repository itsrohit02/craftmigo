import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { adminService } from "../../api/misc.service";
import StatusBadge from "../../components/ui/StatusBadge";
import { Spinner, EmptyState } from "../../components/ui/States";

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .listBookings()
      .then((res) => setBookings(res.data.bookings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading bookings..." />;

  return (
    <div>
      <h1 className="text-2xl font-700">Bookings</h1>

      <div className="mt-6">
        {bookings.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No bookings yet." />
        ) : (
          <div className="card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Worker</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id} className="border-t border-ink-50">
                    <td className="px-4 py-3 text-ink-600">{b.bookingCode}</td>
                    <td className="px-4 py-3 font-medium text-ink-900">{b.service?.title}</td>
                    <td className="px-4 py-3 text-ink-600">{b.customer?.name}</td>
                    <td className="px-4 py-3 text-ink-600">{b.worker?.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookingsPage;
