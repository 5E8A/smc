import { useLanguage } from "../context/useLanguage";
import { Link } from "@tanstack/react-router";
import { GithubLogoIcon } from "@phosphor-icons/react";

const Footer = () => {
  const { t, language } = useLanguage();

  const langParams = { lang: language };

  return (
    <footer className="border-t border-white/10 bg-black/60 pt-16 pb-8 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 space-y-4 md:col-span-2">
            <h3 className="font-mc text-2xl tracking-wider text-white">
              SMC<span className="text-mc-text-muted">MODS</span>
            </h3>
            <p className="max-w-sm text-sm leading-relaxed text-mc-text-muted">{t.footer.desc}</p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-wider text-white uppercase">{t.footer.resources}</h4>
            <ul className="space-y-2 text-sm text-mc-text">
              <li>
                <a
                  href="https://www.curseforge.com/members/5e8a/projects"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-mc-green-text"
                >
                  CurseForge
                </a>
              </li>
              <li>
                <a
                  href="https://modrinth.com/user/5E8A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-mc-green-text"
                >
                  Modrinth
                </a>
              </li>
              <li>
                <Link to="/$lang/wiki" params={langParams} preload="intent" className="transition-colors hover:text-mc-green-text">
                  {t.hero.wiki}
                </Link>
              </li>
              <li>
                <Link to="/$lang/credits" params={langParams} preload="intent" className="transition-colors hover:text-mc-green-text">
                  {t.footer.credits}
                </Link>
              </li>
            </ul>
          </div>

          {/* Socials */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-wider text-white uppercase">{t.footer.connect}</h4>
            <div className="flex space-x-3">
              <a
                href="https://discord.gg/uaX8D5jQp2"
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-lg bg-white/5 p-2 text-mc-text-muted transition-colors hover:bg-white/10 hover:text-white"
              >
                <span className="sr-only">Discord</span>
                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1569 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
                </svg>
              </a>
              <a
                href="https://github.com/5E8A"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-white/5 p-2 text-mc-text-muted transition-colors hover:bg-white/10 hover:text-white"
              >
                <span className="sr-only">GitHub</span>
                <GithubLogoIcon className="size-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8">
          <div className="flex flex-col items-start justify-between text-sm text-mc-text-muted md:flex-row md:items-center">
            <p>
              &copy; {new Date().getFullYear()} {t.footer.copyright}
              <br />
              {t.footer.copyrightName}
            </p>
            <p className="order-2 mt-2 flex items-center md:order-3 md:mt-0">
              <a href="https://github.com/logyQT" target="_blank" rel="noopener noreferrer">
                {t.footer.made_with}
              </a>
            </p>
            <p className="order-3 mt-2 text-xs md:order-2 md:mt-0">{t.footer.rights}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
