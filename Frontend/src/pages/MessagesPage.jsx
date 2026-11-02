import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { messageService } from "../api/misc.service";
import { useAuthStore } from "../store/authStore";
import { Spinner, EmptyState, ErrorState } from "../components/ui/States";

const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuthStore();

  const fetchConversations = () =>
    messageService
      .listConversations()
      .then((res) => setConversations(res.data.conversations))
      .catch((requestError) => {
        setConversations([]);
        setError(requestError.response?.data?.message || "We couldn't load messages.");
      })
      .finally(() => setLoading(false));

  const load = () => {
    setLoading(true);
    setError("");
    fetchConversations();
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  if (loading) return <Spinner label="Loading conversations..." />;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-700">Messages</h1>

      <div className="mt-6">
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : conversations.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No conversations yet" description="Message a worker or customer from a booking or profile to start chatting." />
        ) : (
          <div className="space-y-2">
            {conversations.map((c) => {
              const other = c.participants.find((p) => p._id !== user?._id);
              return (
                <Link key={c._id} to={`/messages/${c._id}`} className="card p-4 flex items-center gap-3 hover:border-ink-400 transition-colors">
                  <div className="h-11 w-11 rounded-full bg-denim overflow-hidden flex items-center justify-center text-white font-semibold shrink-0">
                    {other?.avatar?.url ? <img src={other.avatar.url} alt="" className="h-full w-full object-cover" /> : other?.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{other?.name}</p>
                    <p className="text-xs text-ink-400 truncate">{c.lastMessage?.text || "No messages yet"}</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rust px-1.5 text-[10px] font-bold text-white">
                      {c.unreadCount > 5 ? "5+" : c.unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
