import { useLanguage } from "../context/useLanguage";
import { parseRichText } from "../utils/richText";

const CreditsView = () => {
  const { t } = useLanguage();

  const sections = [
    { title: t.credits.disclaimer_title, text: t.credits.disclaimer_text },
    { title: t.credits.assets_title, text: t.credits.assets_text },
    { title: t.credits.wallpaper_title, text: t.credits.wallpaper_text },
    { title: t.credits.fonts_title, text: t.credits.fonts_text },
    { title: t.credits.operator_title, text: t.credits.operator_text },
    { title: t.credits.affiliate_title, text: t.credits.affiliate_text },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-transparent pt-10 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 w-full">
        <div className="bg-mc-surface border border-white/10 rounded-xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-mc-green/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <h1 className="text-4xl md:text-5xl font-mc text-white mb-4 font-pixel-shadow relative z-10">
            {t.credits.title}
          </h1>
          <p className="text-mc-text text-lg relative z-10 mb-0 max-w-2xl">{t.credits.subtitle}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="bg-mc-surface border border-white/10 rounded-xl p-8">
            <h2 className="text-xl font-bold text-white mb-3">{section.title}</h2>
            <p className="text-mc-text leading-relaxed">{parseRichText(section.text)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreditsView;
