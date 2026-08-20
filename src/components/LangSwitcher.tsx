import { Select } from "@base-ui/react/select";
import { CaretDownIcon } from "@phosphor-icons/react";
import { GbFlag, PlFlag } from "./Flags";

type LangSwitcherProps = {
  language: "en" | "pl";
  setLanguage: (lang: "en" | "pl") => void;
  t: { common: { language: string }; [key: string]: unknown };
  className?: string;
};

const flags = { en: GbFlag, pl: PlFlag } as const;

const items = {
  en: "English",
  pl: "Polski",
} as const;

const LangSwitcher = ({ language, setLanguage, t, className }: LangSwitcherProps) => (
  <div className={className}>
    <Select.Root
      value={language}
      onValueChange={(value) => setLanguage(value as "en" | "pl")}
      items={items}
      modal={false}
    >
      <Select.Trigger
        aria-label={t.common.language}
        className="rounded-lg p-3 backdrop-blur-xl flex items-center gap-1.5 focus:outline-none cursor-pointer transition-colors text-mc-text hover:text-white"
      >
        <Select.Value>
          {(value: "en" | "pl") => {
            const Flag = flags[value];
            return <Flag className="w-5 h-auto rounded-[2px]" />;
          }}
        </Select.Value>
        <Select.Icon className="transition-transform duration-200 data-[popup-open]:rotate-180 text-mc-text-muted">
          <CaretDownIcon className="w-3 h-3" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={4} align="center" className="z-50">
          <Select.Popup className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden py-1 min-w-[140px]">
            <Select.List className="flex flex-col">
              {(Object.entries(items) as Array<["en" | "pl", string]>).map(([value, label]) => (
                <Select.Item
                  key={value}
                  value={value}
                  className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer outline-none select-none text-mc-text hover:text-white hover:bg-white/10 data-[highlighted]:bg-white/10 data-[highlighted]:text-white transition-colors"
                >
                  {(() => {
                    const Flag = flags[value];
                    return <Flag className="w-5 h-auto rounded-[2px]" />;
                  })()}
                  <Select.ItemText>{label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  </div>
);

export default LangSwitcher;
