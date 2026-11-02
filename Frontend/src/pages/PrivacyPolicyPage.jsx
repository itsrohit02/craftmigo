import { Link } from "react-router-dom";

const PrivacyPolicyPage = () => (
  <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-dark">CraftMIgo policies</p>
    <h1 className="mt-3 text-3xl font-700 text-ink-900">Privacy policy</h1>
    <p className="mt-2 text-sm text-ink-400">Last updated: October 15, 2026</p>

    <div className="prose-craftmigo mt-8 space-y-7 text-sm leading-7 text-ink-600">
      <section>
        <h2>Information we handle</h2>
        <p>
          CraftMIgo processes information needed to operate the local-services marketplace. Depending on how you use
          the service, this may include your name, email address, phone number, account role, profile and avatar,
          service address and booking details, messages, reviews, and account activity.
        </p>
        <p>
          Workers may submit identity or certification images for verification. These documents are restricted to
          authorized administrators for verification review and are not intended to appear in public worker profiles.
        </p>
      </section>

      <section>
        <h2>How information is used</h2>
        <p>
          Information is used to create and secure accounts, connect customers and workers, manage bookings and
          messages, review worker verification submissions, provide support, moderate reviews, and maintain the
          reliability and safety of the platform.
        </p>
      </section>

      <section>
        <h2>Cookies and authentication</h2>
        <p>
          The service uses HTTP-only cookies for authentication and session renewal. These cookies are needed for
          sign-in and protected features. Your browser may also retain account display state locally.
        </p>
      </section>

      <section>
        <h2>Service providers and sharing</h2>
        <p>
          Information is stored in the platform database and relevant files may be processed by Cloudinary for
          image storage. Email services may be used for account-related messages such as password-reset links.
          Information is shared with other users only as needed for marketplace features—for example, booking
          participants see the details needed to arrange a service.
        </p>
        <p>
          We do not describe payment information as being processed by a payment gateway: CraftMIgo does not
          currently integrate a live payment provider.
        </p>
      </section>

      <section>
        <h2>Retention and security</h2>
        <p>
          Information is retained as needed to operate accounts, bookings, verification, and platform records.
          Access controls and other safeguards are used to protect personal information, but no online system can
          guarantee absolute security. Contact us to ask a question or raise a privacy concern.
        </p>
      </section>

      <section>
        <h2>Your choices and contact</h2>
        <p>
          You can review and update some profile details from your account. For questions or requests concerning
          personal information, use the details on our <Link className="text-denim underline" to="/contact">Contact & support</Link> page.
          Applicable privacy rights may depend on where you live.
        </p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>
          This policy may be updated as the service changes. The date above indicates the latest revision shown on
          this page.
        </p>
      </section>
    </div>
  </article>
);

export default PrivacyPolicyPage;
