import { MediaBrowser } from "./MediaBrowser";

export const AssetsView = () => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="mr-auto text-sm font-bold text-white">
        Assets
        <span className="ml-2 text-xs font-normal text-zinc-500">
          upload with the button or by dropping files onto the grid - folders and images are managed in place
        </span>
      </h2>
    </div>

    <MediaBrowser manageFolders />
  </div>
);
