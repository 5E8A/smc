import { MagnifyingGlassIcon } from "@phosphor-icons/react";

interface SearchHeaderProps {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const SearchHeader = ({ title, subtitle, searchPlaceholder, searchTerm, onSearchChange }: SearchHeaderProps) => {
  return (
    <div className="mx-auto mb-12 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-mc-surface p-8 shadow-xl">
        <h1 className="relative z-10 mb-4 font-mc text-4xl text-white font-pixel-shadow md:text-5xl">{title}</h1>
        <p className="relative z-10 mb-8 max-w-2xl text-lg text-mc-text">{subtitle}</p>

        <div className="relative z-10 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="size-5 text-mc-text-muted" />
          </div>
          <input
            type="search"
            aria-label={searchPlaceholder}
            className="block w-full rounded-lg border border-white/10 bg-black/40 py-3 pr-3 pl-10 leading-5 text-white placeholder-mc-text-muted transition-colors focus:border-mc-green focus:ring-1 focus:ring-mc-green focus:outline-none sm:text-sm"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchHeader;
