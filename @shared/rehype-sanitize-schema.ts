import { defaultSchema, type Options } from "rehype-sanitize";

/**
 * Shared rehype-sanitize schema for all markdown renderers (CMS preview + production site).
 *
 * Blocks all raw HTML except the custom `<icon>` and `<carousel>` elements produced by
 * processIcons/processCarousel in @shared/markdown. Event-handler attributes (onerror,
 * onload, etc.), <script>, <iframe>, <object>, <embed>, <form>, and non-checkbox <input>
 * are all stripped by the base schema.
 *
 * Plugin order in the renderers: rehype-slug → rehype-raw → rehype-sanitize.
 *
 * `data-md-line` survives sanitization on all elements: the CMS editor stamps every
 * top-level block with it (via remarkLineAttrs) as the anchor for caret/scroll sync.
 */
export const smcSanitizeSchema: Options = {
  ...defaultSchema,
  clobberPrefix: "",
  tagNames: [...(defaultSchema.tagNames ?? []), "icon", "carousel"],
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "dataMdLine"],
    td: ["className"],
    th: ["className"],
    icon: ["name"],
    carousel: ["images"],
  },
};
