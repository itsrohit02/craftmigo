import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Users } from "lucide-react";
import { workerService } from "../api/worker.service";
import { Spinner, EmptyState } from "../components/ui/States";

const WorkersPage = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workerService
      .listWorkers()
      .then((res) => setWorkers(res.data.workers))
      .catch(() => setWorkers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Local professionals</p>
          <h1 className="mt-2 text-2xl font-700">Find the right worker</h1>
          <p className="mt-1 max-w-xl text-sm text-ink-400">Browse trusted professionals, compare their experience, and choose the right person for your work.</p>
        </div>
        {!loading && workers.length > 0 && <p className="text-sm font-medium text-ink-400">{workers.length} workers</p>}
      </div>

      <div className="mt-8">
        {loading ? (
          <Spinner label="Loading workers..." />
        ) : workers.length === 0 ? (
          <EmptyState icon={Users} title="No workers available yet" />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {workers.map((w) => (
              <Link key={w._id} to={`/workers/${w.user?._id}`} className="card p-5 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_8px_24px_rgba(6,59,36,0.08)]">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-denim overflow-hidden flex items-center justify-center text-white font-semibold shrink-0">
                    {w.user?.avatar?.url ? (
                      <img src={w.user.avatar.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      w.user?.name?.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{w.user?.name}</p>
                    <p className="text-xs text-ink-400 flex items-center gap-1">
                      <Star size={12} className="fill-amber text-amber" /> {w.ratingAverage?.toFixed(1) || "New"} ({w.ratingCount || 0})
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-ink-400 line-clamp-2">{w.bio || "No bio yet."}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {w.categories?.slice(0, 3).map((c) => (
                    <span key={c._id} className="rounded-sm bg-ink-50 px-2 py-0.5 text-[11px] text-ink-600">
                      {c.name}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkersPage;
