import { VersionData } from "@/types";

const REQUEST_TIMEOUT_MS = 10000;

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

const request = async <T>(
  baseUrl: string,
  path: string,
  params?: Record<string, string | number | boolean>
): Promise<T> => {
  const url = new URL(`${baseUrl}/${path.replace(/^\//, "")}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Request to ${url.toString()} failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
};

let discordMembersCache: number | null = null;
export const getActiveDiscordMembers = async (): Promise<number> => {
  if (discordMembersCache !== null) return discordMembersCache;
  try {
    const data = await request<{ approximate_member_count: number }>(DISCORD_BASE_URL, "/invites/uaX8D5jQp2", {
      with_counts: true,
    });
    discordMembersCache = data.approximate_member_count;
    return discordMembersCache;
  } catch (error) {
    console.error("Error fetching Discord members:", error);
    return 0;
  }
};

let projectCache: ModrinthProject | null = null;
const getProjectData = async (id: string): Promise<ModrinthProject | null> => {
  if (projectCache !== null) return projectCache;
  try {
    projectCache = await request<ModrinthProject>(MODRINTH_BASE_URL, `/project/${id}`);
    return projectCache;
  } catch (error) {
    console.error("Error fetching project data:", error);
    return null;
  }
};

let verCache: VersionData | null = null;
export const getLatestVersionData = async (id: string): Promise<VersionData | null> => {
  if (verCache !== null) return verCache;
  try {
    const projectData = await getProjectData(id);
    if (projectData && projectData.versions && projectData.versions.length > 0) {
      try {
        const version = await request<ModrinthVersion>(
          MODRINTH_BASE_URL,
          `/version/${projectData.versions[projectData.versions.length - 1]}`
        );
        verCache = { version_number: version.version_number, game_version: version.game_versions[0] };
        return verCache;
      } catch (error) {
        console.error("Error fetching version data:", error);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching latest version:", error);
    return null;
  }
};

let downloadsCache: number | null = null;
export const getTotalDownloads = async (id: string): Promise<number> => {
  if (downloadsCache !== null) return downloadsCache;
  try {
    const projectData = await getProjectData(id);
    if (projectData) {
      downloadsCache = projectData.downloads;
      return downloadsCache;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching total downloads:", error);
    return 0;
  }
};
