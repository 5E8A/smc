import { VersionData } from "@/types";

const REQUEST_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;
const RETRY_DELAYS_MS = [500, 1000];
const CACHE_TTL_MS = 10 * 60 * 1000;

const DISCORD_BASE_URL = "https://discord.com/api/v10";
const MODRINTH_BASE_URL = "https://api.modrinth.com/v2";

interface ModrinthProject {
  downloads: number;
  versions: string[];
}

interface ModrinthVersion {
  version_number: string;
  game_versions: string[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const request = async <T>(
  baseUrl: string,
  path: string,
  params?: Record<string, string | number | boolean>
): Promise<T> => {
  const url = new URL(`${baseUrl}/${path.replace(/^\//, "")}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`Request to ${url.toString()} failed with status ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAYS_MS[attempt]);
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw lastError;
};

interface CacheEntry<T> {
  value: T;
  ts: number;
}

const createCachedGetter = <T>(label: string, loader: () => Promise<T>, onError: () => T): (() => Promise<T>) => {
  let entry: CacheEntry<T> | null = null;
  let inflight: Promise<T> | null = null;

  return async () => {
    if (inflight) return inflight;
    if (entry !== null && Date.now() - entry.ts < CACHE_TTL_MS) return entry.value;

    inflight = loader()
      .then((value) => {
        entry = { value, ts: Date.now() };
        return value;
      })
      .catch((error) => {
        console.error(`Error fetching ${label}:`, error);
        return onError();
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  };
};

const getDiscordMembers = createCachedGetter(
  "Discord members",
  () =>
    request<{ approximate_member_count: number }>(DISCORD_BASE_URL, "/invites/uaX8D5jQp2", {
      with_counts: true,
    }).then((data) => data.approximate_member_count),
  () => 0
);

export const getActiveDiscordMembers = async (): Promise<number> => getDiscordMembers();

const projectGetters = new Map<string, () => Promise<ModrinthProject | null>>();
const getProjectData = (id: string): Promise<ModrinthProject | null> => {
  let getter = projectGetters.get(id);
  if (!getter) {
    getter = createCachedGetter<ModrinthProject | null>(
      "project data",
      () => request<ModrinthProject>(MODRINTH_BASE_URL, `/project/${id}`),
      () => null
    );
    projectGetters.set(id, getter);
  }
  return getter();
};

const versionGetters = new Map<string, () => Promise<VersionData | null>>();
export const getLatestVersionData = (id: string): Promise<VersionData | null> => {
  let getter = versionGetters.get(id);
  if (!getter) {
    getter = createCachedGetter<VersionData | null>(
      "version data",
      async () => {
        const projectData = await getProjectData(id);
        if (projectData && projectData.versions && projectData.versions.length > 0) {
          const version = await request<ModrinthVersion>(
            MODRINTH_BASE_URL,
            `/version/${projectData.versions[projectData.versions.length - 1]}`
          );
          return { version_number: version.version_number, game_version: version.game_versions[0] };
        }
        return null;
      },
      () => null
    );
    versionGetters.set(id, getter);
  }
  return getter();
};

const downloadsGetters = new Map<string, () => Promise<number>>();
export const getTotalDownloads = (id: string): Promise<number> => {
  let getter = downloadsGetters.get(id);
  if (!getter) {
    getter = createCachedGetter<number>(
      "total downloads",
      async () => {
        const projectData = await getProjectData(id);
        return projectData ? projectData.downloads : 0;
      },
      () => 0
    );
    downloadsGetters.set(id, getter);
  }
  return getter();
};
