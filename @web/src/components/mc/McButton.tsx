import type { ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";

type Variant = "primary" | "secondary";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-mc-green text-white border-2 border-[#1e1e1e] shadow-[inset_0_2px_0_rgba(255,255,255,0.2),0_4px_0_#1e1e1e] hover:bg-mc-green-light active:bg-mc-green-dark active:shadow-[inset_0_2px_0_rgba(0,0,0,0.2),0_2px_0_#1e1e1e]",
  secondary:
    "bg-mc-border text-zinc-200 border-2 border-[#18181b] shadow-[inset_0_2px_0_rgba(255,255,255,0.1),0_4px_0_#18181b] hover:bg-mc-stone-light active:bg-mc-stone-dark active:shadow-none",
};

const BASE = "font-semibold uppercase tracking-wider btn-press";

type McButtonProps =
  | {
      as?: "button";
      variant?: Variant;
      children: ReactNode;
      className?: string;
      type?: "button" | "submit" | "reset";
      onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    }
  | ({
      as: "link";
      variant?: Variant;
      children: ReactNode;
      className?: string;
    } & Omit<LinkProps, "children"> & { rel?: string })
  | {
      as: "a";
      variant?: Variant;
      children: ReactNode;
      className?: string;
      href?: string;
      target?: string;
      rel?: string;
      onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
    };

const McButton = ({ variant = "primary", className = "", children, ...rest }: McButtonProps) => {
  const classes = [BASE, VARIANT_CLASSES[variant], className].join(" ");

  if ("as" in rest && rest.as === "link") {
    const { as: _, rel: _rel, ...linkRest } = rest;
    return (
      <Link className={classes} {...linkRest}>
        {children}
      </Link>
    );
  }

  if ("as" in rest && rest.as === "a") {
    const { as: _, ...anchorRest } = rest;
    return (
      <a className={classes} {...anchorRest}>
        {children}
      </a>
    );
  }

  const { as: _, ...buttonRest } = rest;
  return (
    <button type="button" className={classes} {...buttonRest}>
      {children}
    </button>
  );
};

export default McButton;
