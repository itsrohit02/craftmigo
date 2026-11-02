import { Link } from "react-router-dom";

const TermsOfServicePage = () => (
  <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-dark">CraftMIgo policies</p>
    <h1 className="mt-3 text-3xl font-700 text-ink-900">Terms of service</h1>
    <p className="mt-2 text-sm text-ink-400">Last updated: October 15, 2026</p>

    <div className="prose-craftmigo mt-8 space-y-7 text-sm leading-7 text-ink-600">
      <section>
        <h2>Using CraftMIgo</h2>
        <p>
          CraftMIgo provides a platform for customers to discover local service workers and manage service requests.
          By using the platform, you agree to provide accurate account information, keep your credentials secure,
          and use the service lawfully and respectfully.
        </p>
      </section>

      <section>
        <h2>Customer and worker responsibilities</h2>
        <p>
          Customers are responsible for providing accurate booking details and coordinating service arrangements.
          Workers are responsible for keeping service listings, pricing, availability, profile information, and
          submitted verification information accurate. Workers must not claim a verification status they have not
          received through the platform.
        </p>
        <p>
          Do not use the platform to harass, threaten, deceive, impersonate, or share unlawful or harmful content.
          Account access may be restricted for misuse or policy violations.
        </p>
      </section>

      <section>
        <h2>Bookings and payments</h2>
        <p>
          Booking requests and their status are managed through the platform. A booking is subject to the worker’s
          response and the status shown in the app. Users should review the booking details and communicate about
          changes or cancellation through the available platform features.
        </p>
        <p>
          CraftMIgo does not currently integrate a live payment gateway. A payment status displayed in the app
          should not be treated as proof of a real-world payment processed by CraftMIgo.
        </p>
      </section>

      <section>
        <h2>Profiles, reviews, and verification</h2>
        <p>
          Users are responsible for content they submit, including service descriptions, portfolio images, messages,
          and reviews. Reviews should reflect genuine experiences. CraftMIgo may moderate or hide content that
          violates these terms.
        </p>
        <p>
          Worker verification is a platform review process; it is not a guarantee of a worker’s skills, conduct,
          licensing, insurance, or the outcome of a service. Customers should independently assess their needs and
          confirm any qualifications required for their job.
        </p>
      </section>

      <section>
        <h2>Platform availability and responsibility</h2>
        <p>
          We work to keep the platform available and useful, but features may change or be temporarily unavailable.
          CraftMIgo helps users connect; customers and workers remain responsible for agreeing on and carrying out
          the actual service.
        </p>
      </section>

      <section>
        <h2>Questions and updates</h2>
        <p>
          If you have a question about these terms, visit <Link className="text-denim underline" to="/contact">Contact & support</Link>.
          We may update the terms as the platform changes; the date above identifies the latest revision shown here.
        </p>
      </section>
    </div>
  </article>
);

export default TermsOfServicePage;
