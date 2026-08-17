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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 w-full">
      <div className="bg-mc-surface border border-white/10 rounded-xl p-8 shadow-xl relative overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-mc text-white mb-4 font-pixel-shadow relative z-10">{title}</h1>
        <p className="text-mc-text text-lg relative z-10 mb-8 max-w-2xl">{subtitle}</p>

        <div className="relative max-w-md z-10">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-mc-text-muted" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-lg leading-5 bg-black/40 text-white placeholder-mc-text-muted focus:outline-none focus:ring-1 focus:ring-mc-green focus:border-mc-green sm:text-sm transition-colors"
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
