import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Mail, MapPin, MessageSquareText, Phone, Twitter } from "lucide-react";
import { feedbackService, settingsService } from "../api/misc.service";
import { ErrorState, Spinner } from "../components/ui/States";
import { useAuthStore } from "../store/authStore";

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", Icon: Instagram },
  { key: "facebook", label: "Facebook", Icon: Facebook },
  { key: "twitter", label: "Twitter", Icon: Twitter },
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin },
];

const ContactPage = () => {
  const { isAuthenticated, isInitializing } = useAuthStore();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState("");

  useEffect(() => {
    settingsService
      .getContact()
      .then((response) => {
        setContact(response.data.contact);
        setError("");
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || "We couldn't load contact details.");
      })
      .finally(() => setLoading(false));
  }, [retry]);

  const retryLoading = () => {
    setLoading(true);
    setError("");
    setRetry((attempt) => attempt + 1);
  };

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedbackError("");
    setFeedbackSuccess("");
    try {
      const response = await feedbackService.create({ message });
      setMessage("");
      setFeedbackSuccess(response.message || "Your feedback has been submitted.");
    } catch (requestError) {
      setFeedbackError(requestError.response?.data?.message || "We couldn't submit your feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-dark">We’re here to help</p>
        <h1 className="mt-3 text-3xl font-700 text-ink-900 sm:text-4xl">Contact & support</h1>
        <p className="mt-3 text-sm leading-6 text-ink-600">
          Have a question about a booking or need help using CraftMIgo? Reach out through the contact options below.
        </p>
      </header>

      <div className="mt-8 grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
        <section className="card bg-ink-900 p-6 text-white sm:p-8" aria-labelledby="get-in-touch">
          <h2 id="get-in-touch" className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-light">
            Get in touch
          </h2>
          {loading ? (
            <div className="mt-5 rounded-lg bg-white p-2" role="status">
              <Spinner label="Loading contact details..." />
            </div>
          ) : error ? (
            <div className="mt-5 rounded-lg bg-white">
              <ErrorState message={error} onRetry={retryLoading} />
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <ContactItem Icon={Mail} label="Email">
                {contact?.supportEmail ? (
                  <a className="break-all text-white hover:text-amber-light" href={`mailto:${contact.supportEmail}`}>
                    {contact.supportEmail}
                  </a>
                ) : (
                  <span className="text-white/60">Email contact not available yet</span>
                )}
              </ContactItem>
              <ContactItem Icon={Phone} label="Phone">
                {contact?.supportPhone ? (
                  <a className="text-white hover:text-amber-light" href={`tel:${contact.supportPhone}`}>
                    {contact.supportPhone}
                  </a>
                ) : (
                  <span className="text-white/60">Phone contact not available yet</span>
                )}
              </ContactItem>
              <ContactItem Icon={MapPin} label="Location">
                <span className="whitespace-pre-line text-white/80">
                  {contact?.locationAddress || "Location details not available yet"}
                </span>
              </ContactItem>
              <div className="border-t border-white/15 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Follow us</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {SOCIAL_PLATFORMS.filter(({ key }) => contact?.socialLinks?.[key]).map(({ key, label, Icon }) => (
                    <a
                      key={key}
                      href={contact.socialLinks[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`CraftMIgo on ${label}`}
                      className="rounded-full border border-white/20 p-2.5 text-white transition-colors hover:bg-white/10 hover:text-amber-light"
                    >
                      <Icon size={18} />
                    </a>
                  ))}
                  {!SOCIAL_PLATFORMS.some(({ key }) => contact?.socialLinks?.[key]) && (
                    <span className="text-sm text-white/60">Social links coming soon</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="card p-6 sm:p-8">
          <h2 className="text-xl font-700 text-ink-900">How can we help?</h2>
          <p className="mt-3 text-sm leading-6 text-ink-600">
            For booking questions, include your booking reference when contacting support. For account or safety
            concerns, tell us which account or worker profile is involved. Please don’t send passwords or payment
            credentials.
          </p>
          <div className="mt-6 rounded-lg bg-ink-50 p-4">
            <p className="text-sm font-semibold text-ink-900">Need help with a booking?</p>
            <p className="mt-1 text-sm text-ink-600">
              Sign in and open your booking from your dashboard to review its status and details.
            </p>
          </div>
        </section>
      </div>

      <section className="card mt-8 p-6 sm:p-8" aria-labelledby="feedback-heading">
        <div className="flex items-start gap-3">
          <MessageSquareText size={22} className="mt-1 shrink-0 text-amber-dark" aria-hidden="true" />
          <div>
            <h2 id="feedback-heading" className="text-xl font-700 text-ink-900">Share feedback to CraftMigo</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600"> 
              Share feedback or report a concern about CraftMIgo. Only the CraftMigo team can view submissions; they are
              not published publicly.
            </p>
          </div>
        </div>

        {isInitializing ? (
          <Spinner label="Checking your sign-in..." />
        ) : !isAuthenticated ? (
          <div className="mt-5 rounded-lg bg-ink-50 p-4">
            <p className="text-sm text-ink-700">Please log in to submit feedback.</p>
            <Link to="/login" state={{ from: { pathname: "/contact" } }} className="btn-primary mt-4 inline-flex">
              Log in to continue
            </Link>
          </div>
        ) : (
          <form onSubmit={handleFeedbackSubmit} className="mt-6 max-w-2xl space-y-4">
            <div>
              <label htmlFor="feedback-message" className="label">Your feedback</label>
              <textarea
                id="feedback-message"
                required
                minLength={10}
                maxLength={2000}
                rows={5}
                className="input resize-y"
                placeholder="Tell us what happened or how we can improve (10–2000 characters)"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <p className="mt-1 text-right text-xs text-ink-400">{message.length}/2000</p>
            </div>
            {feedbackError && <p className="text-sm text-rust" role="alert">{feedbackError}</p>}
            {feedbackSuccess && <p className="text-sm text-moss" role="status">{feedbackSuccess}</p>}
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Submitting..." : "Submit private feedback"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
};

const ContactItem = ({ Icon, label, children }) => (
  <div className="flex items-start gap-3">
    <Icon size={18} className="mt-0.5 shrink-0 text-amber-light" aria-hidden="true" />
    <div className="min-w-0">
      <p className="text-xs font-medium text-white/60">{label}</p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  </div>
);

export default ContactPage;
