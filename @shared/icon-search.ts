export interface SearchableIcon {
  name: string;
  tags: readonly string[];
  categories: readonly string[];
}

interface BaseParts {
  base: string;
  words: string[];
}

const partsCache = new Map<string, BaseParts>();

function baseParts(name: string): BaseParts {
  const cached = partsCache.get(name);
  if (cached) return cached;
  const stem = name.endsWith("Icon") ? name.slice(0, -4) : name;
  const words = stem
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/\s+/);
  const parts = { base: words.join(""), words };
  partsCache.set(name, parts);
  return parts;
}

/** Positive score for a single-term match against one aspect of the icon, or 0 when it does not match. */
function termScore(
  { base, words }: BaseParts,
  tags: readonly string[],
  categories: readonly string[],
  term: string
): number {
  if (base === term) return 1200;
  if (base.startsWith(term)) return 900;
  if (words.every((w) => w.startsWith(term))) return 850;
  if (base.includes(term)) return 700;
  for (const tag of tags) {
    const t = tag.toLowerCase();
    if (t === term) return 650;
    if (t.startsWith(term)) return 500;
    if (t.includes(term)) return 350;
  }
  for (const category of categories) {
    const c = category.toLowerCase();
    if (c === term || c.includes(term)) return 250;
  }
  // subsequence fallback ("pcl" -> "PushPin"? no, but "pshpn" -> pushpin), penalized by gaps
  let cursor = 0;
  let gaps = 0;
  for (const ch of term) {
    const found = base.indexOf(ch, cursor);
    if (found < 0) return 0;
    gaps += found - cursor;
    cursor = found + 1;
  }
  return Math.max(60, 300 - gaps * 4);
}

const SCORE_FLOOR = 1;

/**
 * Fuzzy icon search in the spirit of phosphoricons.com: ranks exact/prefix
 * matches on the icon name highest, then tag and category hits, then a
 * gap-penalized subsequence match. Every whitespace-separated term must match.
 */
export function searchIcons<T extends SearchableIcon>(items: readonly T[], query: string, limit = 48): T[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const scored: Array<{ item: T; score: number }> = [];
  for (const item of items) {
    const parts = baseParts(item.name);
    let total = 0;
    let matchedAll = true;
    for (const term of terms) {
      const score = termScore(parts, item.tags, item.categories, term);
      if (score < SCORE_FLOOR) {
        matchedAll = false;
        break;
      }
      total += score;
    }
    if (matchedAll) scored.push({ item, score: total });
  }
  scored.sort(
    (a, b) => b.score - a.score || a.item.name.length - b.item.name.length || a.item.name.localeCompare(b.item.name)
  );
  return scored.slice(0, limit).map((entry) => entry.item);
}
