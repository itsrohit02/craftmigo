import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { serviceService, categoryService } from "../api/service.service";
import ServiceCard from "../components/ServiceCard";
import { Spinner } from "../components/ui/States";
import { EmptyState } from "../components/ui/States";

const ServicesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") || "");

  const category = searchParams.get("category") || "";

  useEffect(() => {
    categoryService.list().then((res) => setCategories(res.data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    serviceService
      .list({ q: searchParams.get("q") || undefined, category: category || undefined })
      .then((res) => setServices(res.data.services))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [searchParams, category]);

  const handleSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (q) next.set("q", q);
    else next.delete("q");
    setLoading(true);
    setSearchParams(next);
  };

  const setCategory = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set("category", id);
    else next.delete("category");
    setLoading(true);
    setSearchParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-700">Browse Services</h1>

      <form onSubmit={handleSearch} className="mt-5 relative max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={17} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search services..."
          className="input pl-10"
        />
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory("")}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
            !category ? "bg-ink-900 text-white border-ink-900" : "border-ink-100 text-ink-600"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => setCategory(cat._id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
              category === cat._id ? "bg-ink-900 text-white border-ink-900" : "border-ink-100 text-ink-600"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {loading ? (
          <Spinner label="Loading services..." />
        ) : services.length === 0 ? (
          <EmptyState icon={SlidersHorizontal} title="No services found" description="Try a different search term or category." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {services.map((s) => (
              <ServiceCard key={s._id} service={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
