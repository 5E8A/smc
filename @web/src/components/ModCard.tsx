import type { ModData } from "../data/mods";
import ModIcon from "./ModIcon";

interface ModCardProps {
  mod: ModData;
}

const ModCard = ({ mod }: ModCardProps) => {
  return (
    <a
      href={`https://modrinth.com/mod/${mod.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mc-slot group flex items-center gap-3 rounded-lg p-3"
    >
      <ModIcon slug={mod.slug} icon={mod.icon} alt={mod.title} />
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-white transition-colors group-hover:text-mc-green">
          {mod.title}
        </h3>
        <p className="truncate text-xs text-mc-text-muted">{mod.description}</p>
      </div>
    </a>
  );
};

export default ModCard;