import type { Author } from "@/data/authors";
import { XLogoIcon, YoutubeLogoIcon, GithubLogoIcon, DiscordLogoIcon } from "@phosphor-icons/react";
import type { ComponentType } from "react";

interface SocialEntry {
  icon: ComponentType<{ className?: string }>;
  url: string;
  label?: string;
  name: string;
}

interface AuthorCardProps {
  author: Author;
}

const AuthorCard = ({ author }: AuthorCardProps) => {
  const { socials } = author;

  const links: SocialEntry[] = [
    socials?.twitter && { icon: XLogoIcon, url: socials.twitter.url, label: socials.twitter.label, name: "X" },
    socials?.youtube && {
      icon: YoutubeLogoIcon,
      url: socials.youtube.url,
      label: socials.youtube.label,
      name: "YouTube",
    },
    socials?.github && { icon: GithubLogoIcon, url: socials.github.url, label: socials.github.label, name: "GitHub" },
    socials?.discord && {
      icon: DiscordLogoIcon,
      url: socials.discord.url,
      label: socials.discord.label,
      name: "Discord",
    },
  ].filter(Boolean) as SocialEntry[];

  return (
    <div className="mx-8 mb-8 flex items-center space-x-6 rounded-xl border border-white/5 bg-white/5 p-6 md:mx-12 md:mb-12">
      <img src={author.avatar} alt={author.name} className="size-16 rounded-full object-cover" />
      <div>
        <h3 className="mb-1 text-lg font-bold text-white">{author.name}</h3>
        <p className="text-sm text-mc-text-muted">{author.bio}</p>
        {links.length > 0 && (
          <div className="mt-2 flex items-center gap-3">
            {links.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-mc-text-muted transition-colors hover:text-white"
                aria-label={`${author.name} on ${s.name}`}
              >
                <s.icon className="size-5" />
                {s.label && <span className="text-xs">{s.label}</span>}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorCard;
