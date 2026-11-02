import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { adminService } from "../../api/misc.service";
import { reviewService } from "../../api/misc.service";
import { Spinner, EmptyState } from "../../components/ui/States";

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actingId, setActingId] = useState(null);

  const fetchReviews = () =>
    adminService
      .listReviews()
      .then((res) => setReviews(res.data.reviews))
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load reviews");
      })
      .finally(() => setLoading(false));

  const load = () => {
    setLoading(true);
    setError(null);
    fetchReviews();
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleHidden = async (review) => {
    setActingId(review._id);
    try {
      await reviewService.moderate(review._id, !review.isHidden);
      toast.success(review.isHidden ? "Review restored" : "Review hidden");
      setReviews((rs) =>
        rs.map((r) => (r._id === review._id ? { ...r, isHidden: !r.isHidden } : r))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <Spinner label="Loading reviews..." />;

  if (error) {
    return (
      <EmptyState
        icon={Star}
        title="Couldn't load reviews"
        description={error}
        action={
          <button onClick={load} className="btn-outline mt-2">
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-700">Reviews</h1>
        <p className="text-sm text-ink-400">{reviews.length} total</p>
      </div>

      <div className="mt-6">
        {reviews.length === 0 ? (
          <EmptyState icon={Star} title="No reviews submitted yet." />
        ) : (
          <div className="card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Worker</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Comment</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r._id} className="border-t border-ink-50 align-top">
                    <td className="px-4 py-3 font-medium text-ink-900 whitespace-nowrap">{r.customer?.name || "—"}</td>
                    <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{r.worker?.name || "—"}</td>
                    <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{r.service?.title || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-ink-600">
                        <Star size={13} className="fill-amber text-amber" /> {r.rating}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-600 max-w-xs">
                      {r.comment || <span className="text-ink-400">No comment</span>}
                    </td>
                    <td className="px-4 py-3 text-ink-400 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${r.isHidden ? "bg-rust-light text-rust" : "bg-moss-light text-moss"}`}>
                        {r.isHidden ? "Hidden" : "Visible"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        disabled={actingId === r._id}
                        onClick={() => handleToggleHidden(r)}
                        className="text-xs font-medium text-denim hover:underline"
                      >
                        {r.isHidden ? "Restore" : "Hide"}
                      </button>
                    </td>
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

export default AdminReviewsPage;
