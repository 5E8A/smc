import type { Lang } from "../types";
import { EN_MONTHS, PL_MONTHS } from "../../../shared/months";

const pad = (n: number): string => String(n).padStart(2, "0");

export const todayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const isoToDisplay = (iso: string, lang: Lang): string | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const months = lang === "pl" ? PL_MONTHS : EN_MONTHS;
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
};

export const displayToIso = (display: string, lang: Lang): string | null => {
  const m = /^(\d{1,2}) ([A-Za-z]+) (\d{4})$/.exec(display.trim());
  if (!m) return null;
  const months = lang === "pl" ? PL_MONTHS : EN_MONTHS;
  const monthIndex = months.findIndex((mo) => mo.toLowerCase() === m[2].toLowerCase());
  if (monthIndex < 0) return null;
  return `${m[3]}-${pad(monthIndex + 1)}-${pad(Number(m[1]))}`;
};
