import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Upload } from "lucide-react";
import { workerService } from "../../api/worker.service";
import { Spinner } from "../../components/ui/States";

const STATUS_COPY = {
  unverified: { label: "Not submitted", tone: "bg-ink-50 text-ink-400" },
  pending: { label: "Pending review", tone: "bg-amber-light text-amber-dark" },
  verified: { label: "Verified", tone: "bg-moss-light text-moss" },
  rejected: { label: "Rejected — resubmit", tone: "bg-rust-light text-rust" },
};

const VerificationPage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    workerService
      .getMyProfile()
      .then((res) => setProfile(res.data.profile))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return toast.error("Attach at least one document");

    setSubmitting(true);
    const formData = new FormData();
    files.forEach((f) => formData.append("documents", f));
    try {
      await workerService.submitVerification(formData);
      toast.success("Verification submitted for review");
      setFiles([]);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Loading..." />;

  const status = STATUS_COPY[profile.verificationStatus];

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-700">Verification</h1>

      <div className="mt-5 card p-4 flex items-center gap-3">
        <ShieldCheck className="text-ink-600" size={20} />
        <div>
          <p className="text-sm font-semibold text-ink-900">Status</p>
          <span className={`badge mt-1 ${status.tone}`}>{status.label}</span>
        </div>
      </div>

      {profile.verificationNote && (
        <p className="mt-3 text-sm text-ink-600">
          <span className="font-medium text-ink-900">Admin note:</span> {profile.verificationNote}
        </p>
      )}

      {profile.verificationStatus !== "verified" && (
        <form onSubmit={handleSubmit} className="mt-6 card p-5 space-y-4">
          <div>
            <label className="label">ID / Certification documents</label>
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files))} className="input" />
            <p className="mt-1 text-xs text-ink-400">Upload a government ID or trade certification for review.</p>
          </div>
          <button disabled={submitting} type="submit" className="btn-primary gap-2">
            <Upload size={15} /> {submitting ? "Submitting..." : "Submit for Verification"}
          </button>
        </form>
      )}
    </div>
  );
};

export default VerificationPage;
