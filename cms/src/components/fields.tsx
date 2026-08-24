import type { ReactNode } from "react";

const inputCls =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-green-500";

export const Field = ({
  label,
  hint,
  variant = "label",
  children,
}: {
  label: string;
  hint?: string;
  variant?: "label" | "block";
  children: ReactNode;
}) => {
  const body = (
    <>
      <span className="mb-1 block text-xs font-semibold tracking-wide text-zinc-400 uppercase">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </>
  );
  return variant === "block" ? <div className="block">{body}</div> : <label className="block">{body}</label>;
};

export const TextInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`${inputCls} ${props.className ?? ""}`} />
);

export const TextArea = ({
  ref,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: React.Ref<HTMLTextAreaElement> }) => (
  <textarea ref={ref} {...props} className={`${inputCls} resize-y ${props.className ?? ""}`} />
);

export const ComboInput = ({
  id,
  options,
  ...props
}: { id: string; options: string[] } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <>
    <input {...props} id={id} className={`${inputCls} ${props.className ?? ""}`} list={`${id}-opts`} />
    <datalist id={`${id}-opts`}>
      {options.map((o) => (
        <option key={o} value={o} />
      ))}
    </datalist>
  </>
);

export const Button = ({
  variant = "default",
  className = "",
  ...props
}: { variant?: "default" | "primary" | "danger" | "ghost" } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const variants: Record<string, string> = {
    default: "border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
    primary: "bg-green-600 text-white hover:bg-green-500",
    danger: "border border-red-800/60 bg-red-950/40 text-red-300 hover:bg-red-900/50",
    ghost: "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
  };
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${className}`}
    />
  );
};
