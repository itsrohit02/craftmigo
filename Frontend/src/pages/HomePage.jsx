import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star, ShieldCheck, Clock } from "lucide-react";
import { categoryService } from "../api/service.service";
import { getCategoryIcon } from "../utils/categoryIcons";
import { EmptyState, ErrorState, Spinner } from "../components/ui/States";

const HomePage = () => {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [categoriesRetry, setCategoriesRetry] = useState(0);
  const navigate = useNavigate();

  const retryCategoryLoad = () => {
    setCategoriesLoading(true);
    setCategoriesError("");
    setCategoriesRetry((attempt) => attempt + 1);
  };

  useEffect(() => {
    categoryService
      .list()
      .then((res) => {
        if (!Array.isArray(res.data.categories)) {
          throw new Error("The categories response was invalid.");
        }
        setCategories(res.data.categories);
        setCategoriesError("");
      })
      .catch((error) => {
        setCategories([]);
        setCategoriesError(
          error.response?.data?.message || "We couldn't load service categories. Please try again."
        );
      })
      .finally(() => setCategoriesLoading(false));
  }, [categoriesRetry]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/services?q=${encodeURIComponent(query)}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-700 text-white leading-tight">
              Skilled local help, a few taps away
            </h1>
            <p className="mt-3 text-ink-100/70 text-base">
              Search verified plumbers, electricians, cleaners and more near you — book in minutes,
              track the job in real time.
            </p>

            <form onSubmit={handleSearch} role="search" className="mt-7 flex flex-col sm:flex-row gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={18}/>
                <input
                  id="service-search"
                  type="search"
                  aria-label="Search for a home service"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What do you need help with? e.g. leaking tap"
                  className="w-full rounded-DEFAULT border-0 bg-white py-3 pl-11 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:ring-2 focus:ring-amber outline-none"
                />
              </div>
              <button type="submit" className="btn-primary py-3 px-6 shrink-0">
                Search
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              {categoriesLoading && (
                <p role="status" className="text-sm text-white/70">Loading categories...</p>
              )}
              {categoriesError && (
                <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-white/80">
                  <span>{categoriesError}</span>
                  <button
                    type="button"
                    disabled={categoriesLoading}
                    onClick={retryCategoryLoad}
                    className="underline underline-offset-2 hover:text-white disabled:opacity-60"
                  >
                    Try again
                  </button>
                </div>
              )}
              {!categoriesLoading && !categoriesError && categories.length === 0 && (
                <p className="text-sm text-white/70">Service categories are coming soon.</p>
              )}
              {!categoriesLoading && !categoriesError && categories.slice(0, 6).map((cat) => {
                const Icon = getCategoryIcon(cat.name);
                return (
                  <button
                    key={cat._id}
                    onClick={() => navigate(`/services?category=${cat._id}`)}
                    className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm text-white/90 hover:bg-white/10 transition-colors"
                  >
                    <Icon size={14} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-moss" size={22} />
            <div>
              <p className="text-sm font-semibold text-ink-900">Verified workers</p>
              <p className="text-xs text-ink-400">ID-checked before they go live</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="text-denim" size={22} />
            <div>
              <p className="text-sm font-semibold text-ink-900">Real-time tracking</p>
              <p className="text-xs text-ink-400">Know exactly where your booking stands</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Star className="text-amber-dark" size={22} />
            <div>
              <p className="text-sm font-semibold text-ink-900">Rated by real customers</p>
              <p className="text-xs text-ink-400">Reviews after every completed job</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <h2 className="text-xl font-700">Browse by category</h2>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {!categoriesLoading && !categoriesError && categories.map((cat) => {
            const Icon = getCategoryIcon(cat.name);
            return (
              <button
                key={cat._id}
                onClick={() => navigate(`/services?category=${cat._id}`)}
                className="card flex flex-col items-start gap-3 p-5 text-left hover:border-ink-400 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-DEFAULT bg-amber-light text-amber-dark">
                  <Icon size={19} />
                </div>
                <p className="text-sm font-semibold text-ink-900">{cat.name}</p>
              </button>
            );
          })}
          {categoriesLoading && (
            <div className="col-span-full" role="status">
              <Spinner label="Loading categories..." />
            </div>
          )}
          {categoriesError && (
            <div className="col-span-full" role="alert">
              <ErrorState message={categoriesError} onRetry={retryCategoryLoad} />
            </div>
          )}
          {!categoriesLoading && !categoriesError && categories.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                title="No categories yet"
                description="Service categories will appear here once they have been added."
              />
            </div>
          )}
        </div>
      </section>

      {/* CTA for workers */}
      <section className="bg-denim-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-700 text-white">Skilled at a trade?</h2>
            <p className="mt-1 text-sm text-white/70">Join CraftMIgo and start receiving booking requests.</p>
          </div>
          <a href="/signup?role=worker" className="btn-primary shrink-0">
            Become a Worker
          </a>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
