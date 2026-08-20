import type { ModData } from "../data/mods";
import ModCard from "./ModCard";

interface ModCategoryProps {
  title: string;
  mods: ModData[];
}

const ModCategory = ({ title, mods }: ModCategoryProps) => {
  return (
    <div>
      <h3 className="mb-4 font-mc text-3xl text-white">{title}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {mods.map((mod) => (
          <ModCard key={mod.slug} mod={mod} />
        ))}
      </div>
    </div>
  );
};

export default ModCategory;
