import { CubeIcon } from "@phosphor-icons/react";

interface ModIconProps {
  slug: string;
  icon: string;
  alt: string;
  size?: number;
  className?: string;
  sprite?: string;
  spriteIndex?: number;
}

const slugHue = (slug: string) => {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
};

const SPRITE_COLS = 9;

const spritePlaceholderFor = (src: string): string => src.replace(/\.webp$/i, ".placeholder.webp");

const SpriteIcon = ({ sprite, index, size, className }: { sprite: string; index: number; size: number; className: string }) => {
  const col = index % SPRITE_COLS;
  const row = Math.floor(index / SPRITE_COLS);
  const tilePx = `${SPRITE_COLS * size}px auto`;
  const pos = `${-col * size}px ${-row * size}px`;
  const placeholder = spritePlaceholderFor(sprite);

  return (
    <div
      className={`flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${sprite}), url(${placeholder})`,
        backgroundSize: `${tilePx}, ${tilePx}`,
        backgroundPosition: `${pos}, ${pos}`,
        backgroundRepeat: "no-repeat",
      }}
    />
  );
};

const ModIcon = ({ slug, icon, alt, size = 32, className = "", sprite, spriteIndex }: ModIconProps) => {
  if (sprite != null && spriteIndex != null) {
    return <SpriteIcon sprite={sprite} index={spriteIndex} size={size} className={className} />;
  }

  if (icon) {
    return (
      <img
        src={icon}
        alt={alt}
        width={size}
        height={size}
        className={`rounded-md object-cover flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`rounded-md flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: `hsl(${slugHue(slug)} 30% 22%)` }}
    >
      <CubeIcon
        className="w-1/2 h-1/2"
        weight="duotone"
        style={{ color: `hsl(${slugHue(slug)} 60% 65%)` }}
      />
    </div>
  );
};

export default ModIcon;
