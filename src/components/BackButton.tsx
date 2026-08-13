import { ArrowLeftIcon } from "@phosphor-icons/react";
import { LinkProps, useNavigate, useRouter } from "@tanstack/react-router";
import { useLanguage } from "../context/useLanguage";

interface BackButtonProps {
  fallbackTo: LinkProps["to"];
}

const BackButton = ({ fallbackTo }: BackButtonProps) => {
  const { t } = useLanguage();
  const { history } = useRouter();
  const navigate = useNavigate();

  const handleClick = () => {
    if (history.canGoBack()) {
      history.back();
    } else {
      navigate({ to: fallbackTo });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center text-white/80 hover:text-white bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 transition-colors text-sm cursor-pointer"
    >
      <ArrowLeftIcon className="w-4 h-4 mr-2" />
      {t.common.back}
    </button>
  );
};

export default BackButton;
