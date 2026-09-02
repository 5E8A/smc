import { Select } from "@base-ui/react/select";
import { CaretDownIcon } from "@phosphor-icons/react";
import { translations } from "@/utils/translations";
import { GbFlag, PlFlag } from "./Flags";

type LangSwitcherProps = {
  language: "en" | "pl";
  setLanguage: (lang: "en" | "pl") => void;
  t: (typeof translations)["en"];
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
        className="flex cursor-pointer items-center gap-1.5 rounded-lg p-3 text-mc-text backdrop-blur-xl transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Select.Value>
          {(value: "en" | "pl") => {
            const Flag = flags[value];
            return <Flag className="h-auto w-5 rounded-[2px]" />;
          }}
        </Select.Value>
        <Select.Icon className="text-mc-text-muted transition-transform duration-200 data-[popup-open]:rotate-180">
          <CaretDownIcon className="size-3" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={4} align="center" className="z-50">
          <Select.Popup className="min-w-35 overflow-hidden rounded-lg border border-white/10 bg-black/60 py-1 shadow-2xl backdrop-blur-xl">
            <Select.List className="flex flex-col">
              {(Object.entries(items) as Array<["en" | "pl", string]>).map(([value, label]) => {
                const Flag = flags[value];
                return (
                  <Select.Item
                    key={value}
                    value={value}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-mc-text transition-colors outline-none select-none hover:bg-white/10 hover:text-white data-[highlighted]:bg-white/10 data-[highlighted]:text-white"
                  >
                    <Flag className="h-auto w-5 rounded-[2px]" />
                    <Select.ItemText>{label}</Select.ItemText>
                  </Select.Item>
                );
              })}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  </div>
);

export default LangSwitcher;
