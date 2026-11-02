const STATUS_STYLES = {
  pending: "bg-amber-light text-amber-dark",
  accepted: "bg-brand/10 text-brand-dark",
  on_the_way: "bg-blue-50 text-blue-700",
  started: "bg-violet-50 text-violet-700",
  completed: "bg-moss-light text-moss",
  paid: "bg-moss-light text-moss",
  cancelled: "bg-ink-50 text-ink-400",
  rejected: "bg-rust-light text-rust",
  disputed: "bg-rust-light text-rust",
};

const STATUS_LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  on_the_way: "On the way",
  started: "In progress",
  completed: "Completed",
  paid: "Paid",
  cancelled: "Cancelled",
  rejected: "Rejected",
  disputed: "Disputed",
};

const StatusBadge = ({ status }) => (
  <span className={`badge ${STATUS_STYLES[status] || "bg-ink-50 text-ink-400"}`}>
    {STATUS_LABELS[status] || status}
  </span>
);

export default StatusBadge;
