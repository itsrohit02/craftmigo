const STAGES = [
  { key: "pending", label: "Booking Placed" },
  { key: "accepted", label: "Accepted" },
  { key: "on_the_way", label: "On The Way" },
  { key: "started", label: "Started" },
  { key: "completed", label: "Completed" },
  { key: "paid", label: "Paid" },
];

const BookingTimeline = ({ status }) => {
  if (["cancelled", "rejected", "disputed"].includes(status)) {
    return (
      <div className="rounded-DEFAULT bg-rust-light px-4 py-3 text-sm font-medium text-rust">
        This booking was {status}.
      </div>
    );
  }

  const currentIndex = STAGES.findIndex((s) => s.key === status);

  return (
    <ol className="flex flex-wrap gap-y-4">
      {STAGES.map((stage, idx) => {
        const done = idx <= currentIndex;
        const isLast = idx === STAGES.length - 1;
        return (
          <li key={stage.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  done ? "bg-moss text-white" : "bg-ink-50 text-ink-400"
                }`}
              >
                {idx + 1}
              </div>
              <span className={`text-xs font-medium ${done ? "text-ink-900" : "text-ink-400"}`}>
                {stage.label}
              </span>
            </div>
            {!isLast && (
              <div className={`mx-2 h-px w-8 sm:w-14 ${idx < currentIndex ? "bg-moss" : "bg-ink-100"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default BookingTimeline;
