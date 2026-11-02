import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminService } from "../../api/misc.service";
import { ErrorState, Spinner } from "../../components/ui/States";

const EMPTY_CONTACT = {
  supportEmail: "",
  supportPhone: "",
  locationAddress: "",
  socialLinks: {
    instagram: "",
    facebook: "",
    twitter: "",
    linkedin: "",
  },
};

const SOCIAL_FIELDS = [
  ["instagram", "Instagram URL"],
  ["facebook", "Facebook URL"],
  ["twitter", "X / Twitter URL"],
  ["linkedin", "LinkedIn URL"],
];

const ContactSettingsPage = () => {
  const [contact, setContact] = useState(EMPTY_CONTACT);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    adminService
      .getContactSettings()
      .then((response) => {
        setContact({
          ...EMPTY_CONTACT,
          ...response.data.contact,
          socialLinks: {
            ...EMPTY_CONTACT.socialLinks,
            ...response.data.contact.socialLinks,
          },
        });
        setLoadError("");
      })
      .catch((error) => {
        setLoadError(error.response?.data?.message || "We couldn't load contact settings.");
      })
      .finally(() => setLoading(false));
  }, [retry]);

  const retryLoad = () => {
    setLoading(true);
    setLoadError("");
    setRetry((attempt) => attempt + 1);
  };

  const updateField = (field, value) => {
    setContact((current) => ({ ...current, [field]: value }));
  };

  const updateSocialLink = (platform, value) => {
    setContact((current) => ({
      ...current,
      socialLinks: { ...current.socialLinks, [platform]: value },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await adminService.updateContactSettings(contact);
      setContact(response.data.contact);
      toast.success("Contact settings saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save contact settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading contact settings..." />;
  if (loadError) return <ErrorState message={loadError} onRetry={retryLoad} />;

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Platform settings</p>
      <h1 className="mt-1 text-2xl font-700 text-ink-900">Contact & Support Settings</h1>
      <p className="mt-2 text-sm text-ink-600">
        These details appear on the public Contact & Support page. Leave a field blank to show its unavailable fallback.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 card space-y-5 p-5 sm:p-6">
        <div>
          <label htmlFor="support-email" className="label">Support email</label>
          <input
            id="support-email"
            type="email"
            autoComplete="email"
            className="input"
            value={contact.supportEmail}
            onChange={(event) => updateField("supportEmail", event.target.value)}
            placeholder="support@example.com"
          />
        </div>

        <div>
          <label htmlFor="support-phone" className="label">Support phone number</label>
          <input
            id="support-phone"
            type="tel"
            autoComplete="tel"
            className="input"
            maxLength={40}
            value={contact.supportPhone}
            onChange={(event) => updateField("supportPhone", event.target.value)}
            placeholder="+1 555 000 0000"
          />
        </div>

        <div>
          <label htmlFor="location-address" className="label">Location / address</label>
          <textarea
            id="location-address"
            className="input min-h-24"
            maxLength={300}
            value={contact.locationAddress}
            onChange={(event) => updateField("locationAddress", event.target.value)}
            placeholder="Business location or service area"
          />
        </div>

        <fieldset className="space-y-4 border-t border-ink-100 pt-5">
          <legend className="px-1 text-sm font-semibold text-ink-900">Social media links</legend>
          {SOCIAL_FIELDS.map(([platform, label]) => (
            <div key={platform}>
              <label htmlFor={`social-${platform}`} className="label">{label}</label>
              <input
                id={`social-${platform}`}
                type="url"
                inputMode="url"
                className="input"
                value={contact.socialLinks[platform]}
                onChange={(event) => updateSocialLink(platform, event.target.value)}
                placeholder="https://"
              />
            </div>
          ))}
          <p className="text-xs text-ink-400">Social links must use HTTPS.</p>
        </fieldset>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save contact settings"}
        </button>
      </form>
    </div>
  );
};

export default ContactSettingsPage;
