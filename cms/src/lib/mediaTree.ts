export interface DirNode {
  name: string;
  rel: string;
  children: DirNode[];
}

export const buildDirTree = (dirs: string[]): DirNode[] => {
  const roots: DirNode[] = [];
  const index = new Map<string, DirNode>();
  for (const rel of [...dirs].sort((a, b) => a.localeCompare(b))) {
    const segs = rel.split("/");
    let siblings = roots;
    let prefix = "";
    for (const seg of segs) {
      prefix = prefix ? `${prefix}/${seg}` : seg;
      let node = index.get(prefix);
      if (!node) {
        node = { name: seg, rel: prefix, children: [] };
        index.set(prefix, node);
        siblings.push(node);
      }
      siblings = node.children;
    }
  }
  const sortRec = (nodes: DirNode[]): void => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
};

/** Label for a relative dir — root shows as /content. */
export const dirLabel = (dir: string): string => (dir ? `/content/${dir}` : "/content");
