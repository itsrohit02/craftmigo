import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { messageService, notificationService } from "../api/misc.service";
import { Spinner, EmptyState, ErrorState } from "../components/ui/States";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestLoading, setRequestLoading] = useState(null);

  const fetchNotifications = () =>
    notificationService
      .list()
      .then((res) => setNotifications(res.data.notifications))
      .catch((requestError) => {
        setNotifications([]);
        setError(requestError.response?.data?.message || "We couldn't load notifications.");
      })
      .finally(() => setLoading(false));

  const load = () => {
    setLoading(true);
    setError("");
    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      load();
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleClick = async (n) => {
    if (!n.isRead) {
      try {
        await notificationService.markRead(n._id);
      } catch {
        /* non-critical */
      }
    }
  };

  const handleRequest = async (notification, action) => {
    const conversationId = notification.relatedConversation?._id || notification.relatedConversation;
    if (!conversationId) return;
    setRequestLoading(notification._id);
    try {
      await messageService.respondToRequest(conversationId, action);
      setNotifications((current) => current.filter((item) => item._id !== notification._id));
      toast.success(action === "accept" ? "Message request accepted" : "Message request rejected");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update request");
    } finally {
      setRequestLoading(null);
    }
  };

  if (loading) return <Spinner label="Loading notifications..." />;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-700">Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button onClick={handleMarkAllRead} className="text-sm font-medium text-denim hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      <div className="mt-6">
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications yet." />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const isRequest = n.type === "message_request" && n.relatedConversation?.status === "pending";
              const bookingId = n.relatedBooking?._id || n.relatedBooking;
              const notificationLink =
                n.type === "booking_created" && bookingId
                  ? `/bookings/${bookingId}`
                  : n.link || "#";
              const content = (
                <>
                  <p className="text-sm font-semibold text-ink-900">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-ink-400">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-ink-400">{new Date(n.createdAt).toLocaleString()}</p>
                  {isRequest && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={requestLoading === n._id}
                        onClick={() => handleRequest(n, "accept")}
                        className="btn-primary px-3 py-1.5 text-xs"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={requestLoading === n._id}
                        onClick={() => handleRequest(n, "reject")}
                        className="btn-outline px-3 py-1.5 text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </>
              );

              return isRequest ? (
                <div key={n._id} className={`relative card p-4 ${!n.isRead ? "border-l-4 border-l-amber" : ""}`}>
                  {!n.isRead && <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-rust" aria-label="Unread notification" />}
                  {content}
                </div>
              ) : (
                <Link key={n._id} to={notificationLink} onClick={() => handleClick(n)} className={`relative card p-4 block hover:border-ink-400 transition-colors ${!n.isRead ? "border-l-4 border-l-amber" : ""}`}>
                  {!n.isRead && <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-rust" aria-label="Unread notification" />}
                  {content}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
