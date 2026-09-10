declare const process: { env: { BASE_PATH?: string } };

export const DISCORD_API_BASE = "https://discord.com/api/v10";
export const MODRINTH_API_BASE = "https://api.modrinth.com/v2";
export const MODRINTH_CDN = "https://cdn.modrinth.com/";

export const SITE_BASE_PATH = process.env.BASE_PATH ?? "/smc";
export const ASSETS_BASE_PATH = SITE_BASE_PATH === "/" ? "/assets" : `${SITE_BASE_PATH}/assets`;
export const CONTENT_ASSETS_PREFIX = "/assets";
export const assetPath = (path: string): string => {
  if (!path.startsWith("/")) return path;
  return SITE_BASE_PATH === "/" ? path : `${SITE_BASE_PATH}${path}`;
};

export const MODRINTH_PROJECT_ID = "dOLVvHgi";
