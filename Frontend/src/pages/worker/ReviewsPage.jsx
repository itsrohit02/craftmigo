import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { reviewService } from "../../api/misc.service";
import { useAuthStore } from "../../store/authStore";
import { Spinner, EmptyState } from "../../components/ui/States";

const WorkerReviewsPage = () => {
  const user = useAuthStore((state) => state.user);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;

    reviewService
      .getWorkerReviews(user._id)
      .then((response) => setReviews(response.data.reviews))
      .catch(() => toast.error("Failed to load reviews"))
      .finally(() => setLoading(false));
  }, [user?._id]);

  if (loading) return <Spinner label="Loading reviews..." />;

  const average = reviews.length
    ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-700">Customer Reviews</h1>
          <p className="mt-1 text-sm text-ink-400">Use customer feedback to improve your services.</p>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1 text-sm font-semibold text-ink-600">
            <Star size={16} className="fill-amber text-amber" /> {average} ({reviews.length})
          </div>
        )}
      </div>

      <div className="mt-6">
        {reviews.length === 0 ? (
          <EmptyState icon={Star} title="No reviews yet." description="Customer reviews will appear here after completed bookings." />
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <article key={review._id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-denim text-sm font-semibold text-white">
                      {review.customer?.avatar?.url ? (
                        <img src={review.customer.avatar.url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        review.customer?.name?.charAt(0)?.toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{review.customer?.name || "Customer"}</p>
                      <p className="text-xs text-ink-400">{review.service?.title}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-ink-600">
                    <Star size={14} className="fill-amber text-amber" /> {review.rating}/5
                  </span>
                </div>
                {review.comment ? (
                  <p className="mt-3 text-sm leading-6 text-ink-600">“{review.comment}”</p>
                ) : (
                  <p className="mt-3 text-sm italic text-ink-400">No written feedback.</p>
                )}
                <p className="mt-3 text-[11px] text-ink-400">{new Date(review.createdAt).toLocaleDateString()}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerReviewsPage;
