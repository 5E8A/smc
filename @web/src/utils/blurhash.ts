import { SITE_BASE_PATH } from "@smc/shared/constants";
import hashes from "@/data/blurhash.json";

const hashIndex = hashes as Record<string, string>;

export const getHash = (src: string) => hashIndex[src.replace(`${SITE_BASE_PATH}/`, "")];
