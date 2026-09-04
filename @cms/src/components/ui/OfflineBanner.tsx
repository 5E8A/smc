import { Banner } from "./Banner";
import { Button } from "./fields";

interface OfflineBannerProps {
  onRetry: () => void;
}

export function OfflineBanner({ onRetry }: OfflineBannerProps) {
  return (
    <Banner
      variant="error"
      title="CMS server unreachable"
      className="m-4"
      actions={
        <Button variant="primary" className="px-2.5 py-1 text-xs" onClick={onRetry}>
          Retry
        </Button>
      }
    >
      The local dev server at 127.0.0.1:4000 appears to be down or unresponsive. Check the terminal for errors.
    </Banner>
  );
}
