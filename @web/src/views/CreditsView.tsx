import { useMemo } from "react";
import { useLanguage } from "@/context/useLanguage";
import { parseRichText } from "@/utils/richText";

const CreditsView = () => {
  const { t } = useLanguage();

  const sections = useMemo(
    () => [
      { title: t.credits.disclaimer_title, text: t.credits.disclaimer_text },
      { title: t.credits.assets_title, text: t.credits.assets_text },
      { title: t.credits.wallpaper_title, text: t.credits.wallpaper_text },
      { title: t.credits.fonts_title, text: t.credits.fonts_text },
      { title: t.credits.operator_title, text: t.credits.operator_text },
      { title: t.credits.affiliate_title, text: t.credits.affiliate_text },
    ],
    [t]
  );

  return (
    <div className="flex min-h-screen flex-col bg-transparent pt-10 pb-20">
      <div className="mx-auto mb-12 w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-mc-surface p-8 shadow-xl">
          <div className="absolute top-0 right-0 size-64 translate-x-1/2 -translate-y-1/2 transform rounded-full bg-mc-green/5 blur-3xl"></div>
          <h1 className="relative z-10 mb-4 font-mc text-4xl text-white font-pixel-shadow md:text-5xl">
            {t.credits.title}
          </h1>
          <p className="relative z-10 mb-0 max-w-2xl text-lg text-mc-text">{t.credits.subtitle}</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
        {sections.map((section) => (
          <div key={section.title} className="rounded-xl border border-white/10 bg-mc-surface p-8">
            <h2 className="mb-3 text-xl font-bold text-white">{section.title}</h2>
            <p className="leading-relaxed text-mc-text">{parseRichText(section.text)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreditsView;
