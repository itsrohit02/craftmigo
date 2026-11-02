import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <img src={logo} alt="CraftMIgo" className="h-10 w-auto object-contain" />
          <p className="mt-2 text-sm text-ink-400">
            Verified local professionals, booked in minutes.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-900 mb-3">Customers</p>
          <ul className="space-y-2 text-sm text-ink-400">
            <li><Link to="/services" className="hover:text-ink-900">Browse services</Link></li>
            <li><Link to="/workers" className="hover:text-ink-900">Find workers</Link></li>
            <li><Link to="/signup" className="hover:text-ink-900">Create account</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-900 mb-3">Workers</p>
          <ul className="space-y-2 text-sm text-ink-400">
            <li><Link to="/become-worker" className="hover:text-ink-900">Become a worker</Link></li>
            <li><Link to="/login" className="hover:text-ink-900">Worker login</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-900 mb-3">Company</p>
          <ul className="space-y-2 text-sm text-ink-400">
            <li><Link to="/contact" className="hover:text-ink-900">Contact & support</Link></li>
            <li><Link to="/privacy" className="hover:text-ink-900">Privacy policy</Link></li>
            <li><Link to="/terms" className="hover:text-ink-900">Terms of service</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-100 py-4 text-center text-xs text-ink-400">
        © {new Date().getFullYear()} CraftMIgo. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
