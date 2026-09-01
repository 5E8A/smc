import type { ReactNode } from "react";
import { CheckCircleIcon, CircleNotchIcon, InfoIcon, WarningCircleIcon, WarningIcon, XIcon } from "@phosphor-icons/react";

export type BannerVariant = "error" | "warn" | "success" | "info";

const styles: Record<BannerVariant, { box: string; text: string; dismiss: string; icon: typeof InfoIcon }> = {
  error: {
    box: "border-red-800 bg-red-950/40",
    text: "text-red-300",
    dismiss: "text-red-400 hover:text-red-200",
    icon: WarningCircleIcon,
  },
  warn: {
    box: "border-orange-800 bg-orange-950/40",
    text: "text-orange-300",
    dismiss: "text-orange-400 hover:text-orange-200",
    icon: WarningIcon,
  },
  success: {
    box: "border-green-800 bg-green-950/40",
    text: "text-green-300",
    dismiss: "text-green-400 hover:text-green-200",
    icon: CheckCircleIcon,
  },
  info: {
    box: "border-blue-800 bg-blue-950/40",
    text: "text-blue-300",
    dismiss: "text-blue-400 hover:text-blue-200",
    icon: InfoIcon,
  },
};

export interface BannerProps {
  variant?: BannerVariant;
  title?: ReactNode;
  busy?: boolean;
  dismissable?: boolean;
  onDismiss?: () => void;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export const Banner = ({
  variant = "info",
  title,
  busy = false,
  dismissable = false,
  onDismiss,
  actions,
  className = "",
  children,
}: BannerProps) => {
  const s = styles[variant];
  const Icon = busy ? CircleNotchIcon : s.icon;
  return (
    <div
      role={variant === "error" || variant === "warn" ? "alert" : "status"}
      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${s.box} ${className}`}
    >
      <div className={`flex min-w-0 flex-1 items-center gap-2 text-xs ${s.text}`}>
        <Icon size={15} className={`shrink-0 ${busy ? "animate-spin" : ""}`} />
        <div className="min-w-0 flex-1">
          {title && <p className="font-semibold">{title}</p>}
          {children}
        </div>
      </div>
      {(actions || dismissable) && (
        <div className="flex shrink-0 items-center gap-1.5">
          {actions}
          {dismissable && (
            <button type="button" aria-label="Dismiss" onClick={onDismiss} className={`transition-colors ${s.dismiss}`}>
              <XIcon size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
