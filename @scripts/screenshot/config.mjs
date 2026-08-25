import path from "path";
import { fileURLToPath } from "url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const DEFAULT_BROWSERS = ["chromium", "firefox", "webkit"];

export const DEFAULT_VIEWPORTS = [
  { name: "360x640", width: 360, height: 640 },
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "2560x1440", width: 2560, height: 1440 },
];

export const DEFAULT_OUT_DIR = path.join(root, "screenshots");

export const BASE_PATH = "/smc";
export const SERVER_PORT = 3000;
export const SCREENSHOT_PORT = 3100;
export const MOBILE_BREAKPOINT = 768;

export const LANGUAGES = ["en", "pl"];
