import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { reviewService } from "../../api/misc.service";
import { Spinner, EmptyState } from "../../components/ui/States";

const MyReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewService
      .getMine()
      .then((res) => setReviews(res.data.reviews))
      .catch(() => toast.error("Failed to load review history"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading your reviews..." />;

  return (
    <div>
      <h1 className="text-2xl font-700">My Reviews</h1>

      <div className="mt-6">
        {reviews.length === 0 ? (
          <EmptyState icon={Star} title="You haven't left any reviews yet." />
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r._id} className="card p-4">
                <div className="flex items-center justify-between">
                  <Link to={`/workers/${r.worker?._id}`} className="text-sm font-semibold text-ink-900 hover:underline">
                    {r.worker?.name}
                  </Link>
                  <span className="flex items-center gap-1 text-xs text-ink-600">
                    <Star size={13} className="fill-amber text-amber" /> {r.rating}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-400">{r.service?.title}</p>
                {r.comment && <p className="mt-2 text-sm text-ink-600">{r.comment}</p>}
                <p className="mt-2 text-[11px] text-ink-400">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReviewsPage;
