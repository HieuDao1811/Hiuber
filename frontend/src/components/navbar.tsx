import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiMapPin, FiSearch } from "react-icons/fi";

const Navbar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [city, setCity] = useState(searchParams.get("city") || "Hồ Chí Minh");

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextParams: Record<string, string> = { city };
      if (search.trim()) nextParams.search = search.trim();
      setSearchParams(nextParams);
    }, 400);

    return () => clearTimeout(timer);
  }, [city, search, setSearchParams]);

  return (
    <nav aria-label="Tìm món ăn" className="flex gap-2">
      <label className="flex min-w-0 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs text-dark">
        <FiMapPin className="shrink-0 text-brand" aria-hidden="true" />
        <span className="sr-only">Thành phố</span>
        <select
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className="w-[116px] bg-transparent py-2.5 outline-none"
          aria-label="Chọn thành phố"
        >
          <option>Hồ Chí Minh</option>
          <option>Hà Nội</option>
          <option>Đà Nẵng</option>
        </select>
      </label>
      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm focus-within:border-brand">
        <FiSearch className="shrink-0 text-muted" aria-hidden="true" />
        <span className="sr-only">Tìm nhà hàng hoặc món ăn</span>
        <input
          id="navbar-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm món ăn hoặc nhà hàng"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-dark outline-none placeholder:text-muted"
        />
      </label>
    </nav>
  );
};

export default Navbar;