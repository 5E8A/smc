import { ArrowLeftIcon } from "@phosphor-icons/react";
import { LinkProps, useNavigate, useRouter } from "@tanstack/react-router";
import { useLanguage } from "../context/useLanguage";

interface BackButtonProps {
  fallbackTo: LinkProps["to"];
  fallbackParams?: Record<string, string>;
}

const BackButton = ({ fallbackTo, fallbackParams }: BackButtonProps) => {
  const { t } = useLanguage();
  const { history } = useRouter();
  const navigate = useNavigate();

  const handleClick = () => {
    if (history.canGoBack()) {
      history.back();
    } else {
      navigate({ to: fallbackTo, params: fallbackParams as never });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex cursor-pointer items-center rounded-full border border-white/10 bg-black/50 px-4 py-2 text-sm text-white/80 backdrop-blur-sm transition-colors hover:text-white"
    >
      <ArrowLeftIcon className="mr-2 size-4" />
      {t.common.back}
    </button>
  );
};

export default BackButton;
