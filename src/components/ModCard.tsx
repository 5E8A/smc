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
      className="mc-slot p-3 rounded-lg flex items-center gap-3 group"
    >
      <ModIcon slug={mod.slug} icon={mod.icon} alt={mod.title} />
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-mc-green transition-colors">
          {mod.title}
        </h3>
        <p className="text-xs text-mc-text-muted truncate">{mod.description}</p>
      </div>
    </a>
  );
};

export default ModCard;