import { useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { adminService } from "../../api/misc.service";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "resolved", label: "Resolved" },
];

const FeedbackPage = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);

  const loadFeedback = (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
      setError("");
    }
    adminService
      .listFeedback()
      .then((response) => setFeedback(response.data.feedback))
      .catch((requestError) => {
        setError(requestError.response?.data?.message || "Failed to load feedback.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    adminService
      .listFeedback()
      .then((response) => {
        if (active) setFeedback(response.data.feedback);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "Failed to load feedback.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleStatusChange = async (item, status) => {
    setActingId(item._id);
    try {
      const response = await adminService.updateFeedbackStatus(item._id, status);
      setFeedback((items) => items.map((current) =>
        current._id === item._id ? response.data.feedback : current
      ));
      toast.success("Feedback status updated");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Couldn't update feedback status.");
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <Spinner label="Loading feedback..." />;
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadFeedback}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-700">Private feedback</h1>
        <p className="text-sm text-ink-400">{feedback.length} total</p>
      </div>
      <p className="mt-2 text-sm text-ink-600">
        Feedback submitted from Contact & Support appears here for admins only.
      </p>

      <div className="mt-6">
        {feedback.length === 0 ? (
          <EmptyState icon={MessageSquareText} title="No feedback submitted yet." />
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <article key={item._id} className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-dark">User feedback</p>
                    <p className="mt-1 text-sm font-semibold text-ink-900">
                      {item.user?.name || "Unknown user"}{" "}
                      <span className="font-normal text-ink-400">
                        ({item.user?.email || "No email"} · {item.user?.role || "unknown role"})
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-ink-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-ink-600">
                    Status
                    <select
                      className="input py-1.5"
                      value={item.status}
                      disabled={actingId === item._id}
                      onChange={(event) => handleStatusChange(item, event.target.value)}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-ink-700">
                  {item.message}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;
