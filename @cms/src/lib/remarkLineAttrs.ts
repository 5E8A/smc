interface LineNode {
  position?: { start?: { line?: number } };
  data?: { hProperties?: Record<string, string> };
}

/** Stamps every top-level block with its 1-based markdown source line (data-md-line)
 *  so the editor can anchor preview scrolling to the caret position. */
export function remarkLineAttrs() {
  return (tree: { children: LineNode[] }) => {
    for (const node of tree.children) {
      const line = node.position?.start?.line;
      if (!line) continue;
      node.data ??= {};
      node.data.hProperties = { ...node.data.hProperties, "data-md-line": String(line) };
    }
  };
}
