import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { reviewService } from "../../api/misc.service";

const AddReviewPage = () => {
  const { id } = useParams();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      toast.error("Please write a comment before submitting your review");
      return;
    }

    setLoading(true);
    try {
      await reviewService.create({ bookingId: id, rating, comment: trimmedComment });
      toast.success("Review submitted");
      navigate(`/bookings/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-700">Leave a Review</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="label">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)}>
                <Star size={28} className={n <= rating ? "fill-amber text-amber" : "text-ink-100"} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Comment</label>
          <textarea
            rows={4}
            className="input"
            placeholder="How was your experience?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            aria-required="true"
          />
          <p className="mt-1 text-xs text-ink-400">A comment is required to submit a review.</p>
        </div>
        <button disabled={loading || !comment.trim()} type="submit" className="btn-primary w-full">
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
};

export default AddReviewPage;
