import { type ReactNode } from "react";
import { Select } from "@base-ui/react/select";
import { CheckIcon, CaretDownIcon } from "@phosphor-icons/react";

export interface MultiSelectOption {
  value: string;
  label: ReactNode;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const MultiSelect = ({ options, value, onChange, placeholder = "Select…", className }: MultiSelectProps) => (
  <Select.Root
    multiple
    value={value}
    onValueChange={(v) => onChange(v as string[])}
    items={options.map((o) => ({ label: o.label, value: o.value }))}
    modal={false}
  >
    <Select.Trigger
      className={`flex w-36 items-center gap-1.5 truncate rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] font-medium text-zinc-300 outline-none transition-colors hover:border-zinc-600 hover:text-zinc-100 focus-visible:border-green-500 data-[popup-open]:border-green-500 ${className ?? ""}`}
    >
      <Select.Value
        className="min-w-0 flex-1 truncate text-left"
        placeholder={placeholder}
      >
        {(val: string[]) => {
          if (!val || val.length === 0) return placeholder;
          if (val.length === options.length) return "All";
          if (val.length <= 2) {
            return val
              .map((v) => options.find((o) => o.value === v)?.label ?? v)
              .join(", ");
          }
          return `${val.length} selected`;
        }}
      </Select.Value>
      <Select.Icon className="ml-auto shrink-0 text-zinc-500">
        <CaretDownIcon size={10} />
      </Select.Icon>
    </Select.Trigger>
    <Select.Portal>
      <Select.Positioner sideOffset={4} align="start" side="bottom" alignItemWithTrigger={false} className="z-50">
        <Select.Popup className="min-w-36 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-xl">
          {options.map((opt) => (
            <Select.Item
              key={opt.value}
              value={opt.value}
              className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-[11px] text-zinc-300 outline-none select-none hover:bg-zinc-700 hover:text-zinc-100 data-[highlighted]:bg-zinc-700 data-[highlighted]:text-zinc-100 data-[selected]:text-green-400"
            >
              <Select.ItemIndicator className="w-3 shrink-0">
                <CheckIcon size={10} />
              </Select.ItemIndicator>
              <Select.ItemText>{opt.label}</Select.ItemText>
            </Select.Item>
          ))}
        </Select.Popup>
      </Select.Positioner>
    </Select.Portal>
  </Select.Root>
);
