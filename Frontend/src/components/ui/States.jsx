import { AlertTriangle, RefreshCw } from "lucide-react";

export const Spinner = ({ label }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-400">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-100 border-t-amber" />
    {label && <p className="text-sm">{label}</p>}
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-ink-100 bg-white py-16 px-6 text-center">
    {Icon && <Icon size={32} className="text-ink-400" />}
    <p className="font-display text-base font-600 text-ink-900">{title}</p>
    {description && <p className="max-w-sm text-sm text-ink-400">{description}</p>}
    {action}
  </div>
);

export const ErrorState = ({ message = "Something went wrong.", onRetry }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-rust/30 bg-rust-light/30 py-16 px-6 text-center">
    <AlertTriangle size={32} className="text-rust" />
    <p className="font-display text-base font-600 text-ink-900">Unable to load this content</p>
    <p className="max-w-sm text-sm text-ink-600">{message}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="btn-outline gap-2">
        <RefreshCw size={15} /> Try again
      </button>
    )}
  </div>
);
