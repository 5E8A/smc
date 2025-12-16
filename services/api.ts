import axios from "axios";

const discordAPI = axios.create({
  baseURL: "https://discord.com/api/v10",
  headers: {
    "Content-Type": "application/json",
  },
});

const modrinthAPI = axios.create({
  baseURL: "https://api.modrinth.com/v2",
  headers: {
    "Content-Type": "application/json",
  },
});

let discordMembersCache = null;
export const getActiveDiscordMembers = async (): Promise<number> => {
  if (discordMembersCache !== null) return discordMembersCache;
  try {
    const response = await discordAPI.get("/invites/uaX8D5jQp2", { params: { with_counts: true } });
    console.log(response.data);
    discordMembersCache = response.data.approximate_member_count;
    return discordMembersCache;
  } catch (error) {
    console.error("Error fetching Discord members:", error);
    return 0;
  }
};

let projectCache = null;
const getProjectData = async (id: string): Promise<any> => {
  if (projectCache !== null) return projectCache;
  try {
    const response = await modrinthAPI.get(`/project/${id}`);
    projectCache = response.data;
    return projectCache;
  } catch (error) {
    console.error("Error fetching project data:", error);
    return null;
  }
};

let verCache = null;
export const getLatestVersion = async (id: string): Promise<string | null> => {
  if (verCache !== null) return verCache;
  try {
    const projectData = await getProjectData(id);
    if (projectData && projectData.versions && projectData.versions.length > 0) {
      try {
        const response = await modrinthAPI.get(`/version/${projectData.versions[projectData.versions.length - 1]}`);
        verCache = response.data.version_number;
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

let downloadsCache = null;
export const getTotalDownloads = async (id: string): Promise<number> => {
  if (downloadsCache !== null) return downloadsCache;
  try {
    const projectData = await getProjectData(id);
    if (projectData) {
      downloadsCache = projectData.downloads;
      return downloadsCache;
    }
  } catch (error) {
    console.error("Error fetching total downloads:", error);
    return 0;
  }
};
