import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Briefcase, ShieldCheck } from "lucide-react";
import { adminService } from "../../api/misc.service";
import { Spinner, EmptyState } from "../../components/ui/States";

const AdminWorkersPage = () => {
  const [workers, setWorkers] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");

  const load = () => {
    Promise.all([adminService.listUsers({ role: "worker" }), adminService.listPendingVerifications()])
      .then(([usersRes, pendingRes]) => {
        setWorkers(usersRes.data.users);
        setPending(pendingRes.data.profiles);
      })
      .catch(() => toast.error("Failed to load workers"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleVerify = async (userId, approve) => {
    try {
      await adminService.verifyWorker(userId, approve);
      toast.success(approve ? "Worker verified" : "Verification rejected");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleBlockToggle = async (u) => {
    try {
      if (u.isBlocked) await adminService.unblockWorker(u._id);
      else await adminService.blockWorker(u._id);
      toast.success(u.isBlocked ? "Worker unblocked" : "Worker blocked");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  if (loading) return <Spinner label="Loading workers..." />;

  return (
    <div>
      <h1 className="text-2xl font-700">Workers</h1>

      <div className="mt-5 flex gap-2">
        <button onClick={() => setTab("pending")} className={`rounded-full px-3.5 py-1.5 text-xs font-medium border ${tab === "pending" ? "bg-ink-900 text-white border-ink-900" : "border-ink-100 text-ink-600"}`}>
          Pending Verification ({pending.length})
        </button>
        <button onClick={() => setTab("all")} className={`rounded-full px-3.5 py-1.5 text-xs font-medium border ${tab === "all" ? "bg-ink-900 text-white border-ink-900" : "border-ink-100 text-ink-600"}`}>
          All Workers
        </button>
      </div>

      <div className="mt-6">
        {tab === "pending" ? (
          pending.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No pending verifications." />
          ) : (
            <div className="space-y-3">
              {pending.map((p) => (
                <div key={p._id} className="card p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{p.user?.name}</p>
                    <p className="text-xs text-ink-400">{p.user?.email} · {p.verificationDocs?.length || 0} document(s) submitted</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {p.verificationDocs?.map((doc) => (
                      <a
                        key={doc._id}
                        href={adminService.getVerificationDocumentUrl(p.user._id, doc._id)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-denim hover:underline"
                      >
                        View doc
                      </a>
                    ))}
                    <button onClick={() => handleVerify(p.user._id, true)} className="btn-primary text-xs px-3 py-1.5">Approve</button>
                    <button onClick={() => handleVerify(p.user._id, false)} className="btn-outline text-rust text-xs px-3 py-1.5">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : workers.length === 0 ? (
          <EmptyState icon={Briefcase} title="No workers registered yet." />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((u) => (
                  <tr key={u._id} className="border-t border-ink-50">
                    <td className="px-4 py-3 font-medium text-ink-900">{u.name}</td>
                    <td className="px-4 py-3 text-ink-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.isBlocked ? "bg-rust-light text-rust" : "bg-moss-light text-moss"}`}>
                        {u.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleBlockToggle(u)} className="text-xs font-medium text-denim hover:underline">
                        {u.isBlocked ? "Unblock" : "Block"}
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

export default AdminWorkersPage;
