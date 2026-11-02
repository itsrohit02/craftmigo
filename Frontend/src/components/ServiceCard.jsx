import { Link } from "react-router-dom";
import { Star } from "lucide-react";

const ServiceCard = ({ service }) => (
  <Link
    to={`/services/${service._id}`}
    className="card overflow-hidden flex flex-col hover:border-ink-400 transition-colors group"
  >
    <div className="aspect-[4/3] bg-ink-50 overflow-hidden">
      {service.images?.[0]?.url ? (
        <img
          src={service.images[0].url}
          alt={service.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-ink-400 text-xs">No image</div>
      )}
    </div>
    <div className="p-4 flex-1 flex flex-col">
      <p className="text-xs font-medium text-amber-dark">{service.category?.name}</p>
      <h3 className="mt-1 text-sm font-semibold text-ink-900 line-clamp-2">{service.title}</h3>
      {service.worker?.name && <p className="mt-1 text-xs text-ink-400">by {service.worker.name}</p>}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-ink-600">
          <Star size={13} className="fill-amber text-amber" />
          {service.ratingAverage?.toFixed(1) || "New"}
          {service.ratingCount > 0 && <span className="text-ink-400">({service.ratingCount})</span>}
        </div>
        <p className="text-sm font-semibold text-ink-900">
          ₹{service.pricing?.amount}
          <span className="text-xs font-normal text-ink-400">/{service.pricing?.type === "hourly" ? "hr" : "day"}</span>
        </p>
      </div>
    </div>
  </Link>
);

export default ServiceCard;
