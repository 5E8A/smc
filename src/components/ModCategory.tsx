import type { ModData } from "../data/mods";
import ModCard from "./ModCard";

interface ModCategoryProps {
  title: string;
  mods: ModData[];
}

const ModCategory = ({ title, mods }: ModCategoryProps) => {
  return (
    <div>
      <h3 className="font-mc text-3xl text-white mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {mods.map((mod) => (
          <ModCard key={mod.slug} mod={mod} />
        ))}
      </div>
    </div>
  );
};

export default ModCategory;
