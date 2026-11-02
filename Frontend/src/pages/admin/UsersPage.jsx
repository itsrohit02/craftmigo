import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { adminService } from "../../api/misc.service";
import { Spinner, EmptyState } from "../../components/ui/States";

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    adminService
      .listUsers({ role: "user" })
      .then((res) => setUsers(res.data.users))
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleBlockToggle = async (u) => {
    try {
      if (u.isBlocked) await adminService.unblockUser(u._id);
      else await adminService.blockUser(u._id);
      toast.success(u.isBlocked ? "User unblocked" : "User blocked");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleDelete = async (u) => {
    if (!confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    try {
      await adminService.deleteUser(u._id);
      toast.success("User deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  if (loading) return <Spinner label="Loading users..." />;

  return (
    <div>
      <h1 className="text-2xl font-700">Users</h1>

      <div className="mt-6">
        {users.length === 0 ? (
          <EmptyState icon={Users} title="No customers registered yet." />
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
                {users.map((u) => (
                  <tr key={u._id} className="border-t border-ink-50">
                    <td className="px-4 py-3 font-medium text-ink-900">{u.name}</td>
                    <td className="px-4 py-3 text-ink-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.isBlocked ? "bg-rust-light text-rust" : "bg-moss-light text-moss"}`}>
                        {u.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => handleBlockToggle(u)} className="text-xs font-medium text-denim hover:underline">
                        {u.isBlocked ? "Unblock" : "Block"}
                      </button>
                      <button onClick={() => handleDelete(u)} className="text-xs font-medium text-rust hover:underline">
                        Delete
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

export default AdminUsersPage;
