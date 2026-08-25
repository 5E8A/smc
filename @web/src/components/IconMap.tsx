import { ICON_COMPONENTS } from "./icon-map.generated";

const Icon = ({ name, className }: { name: string; className?: string }) => {
  const Comp = ICON_COMPONENTS[name];
  if (!Comp) return null;
  return <Comp className={className ?? "icon-inline text-green-400"} />;
};

export default Icon;
