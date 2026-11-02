import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { adminService } from "../../api/misc.service";
import { Spinner, EmptyState, ErrorState } from "../../components/ui/States";

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPayments = () =>
    adminService
      .listPayments()
      .then((res) => setPayments(res.data.payments))
      .catch((requestError) => {
        setPayments([]);
        setError(requestError.response?.data?.message || "We couldn't load payments.");
      })
      .finally(() => setLoading(false));

  const load = () => {
    setLoading(true);
    setError("");
    fetchPayments();
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  if (loading) return <Spinner label="Loading payments..." />;

  const total = payments.reduce((sum, p) => sum + p.price, 0);

  return (
    <div>
      <h1 className="text-2xl font-700">Payments</h1>

      <div className="mt-5 card p-5 bg-ink-900 text-white max-w-xs">
        <p className="text-sm text-white/60">Total Collected</p>
        <p className="mt-1 text-2xl font-700">₹{total}</p>
      </div>

      <div className="mt-6">
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payments recorded yet." />
        ) : (
          <div className="card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Worker</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Paid At</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-t border-ink-50">
                    <td className="px-4 py-3 font-medium text-ink-900">{p.service?.title}</td>
                    <td className="px-4 py-3 text-ink-600">{p.customer?.name}</td>
                    <td className="px-4 py-3 text-ink-600">{p.worker?.name}</td>
                    <td className="px-4 py-3 font-medium text-moss">₹{p.price}</td>
                    <td className="px-4 py-3 text-ink-400">{new Date(p.paidAt).toLocaleDateString()}</td>
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

export default AdminPaymentsPage;
