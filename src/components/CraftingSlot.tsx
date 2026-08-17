import { type ReactNode } from "react";

interface CraftingSlotProps {
  icon: ReactNode;
  title: string;
  description: string;
}

const CraftingSlot = ({ icon, title, description }: CraftingSlotProps) => {
  return (
    <div className="mc-slot p-8 rounded-xl flex flex-col items-center text-center">
      <div className="mb-6">{icon}</div>
      <h2 className="font-mc text-2xl text-white mb-3">{title}</h2>
      <p className="text-mc-text-muted text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default CraftingSlot;
