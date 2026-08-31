interface ModIconProps {
  sprite: string;
  spriteIndex: number;
  size?: number;
  className?: string;
}

import { SPRITE_COLS } from "@smc/shared/sprite";

const spritePlaceholderFor = (src: string): string => src.replace(/\.webp$/i, ".placeholder.webp");

const ModIcon = ({ sprite, spriteIndex, size = 32, className = "" }: ModIconProps) => {
  const col = spriteIndex % SPRITE_COLS;
  const row = Math.floor(spriteIndex / SPRITE_COLS);
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

export default ModIcon;
