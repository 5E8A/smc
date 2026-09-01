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
 */
export const smcSanitizeSchema: Options = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "icon", "carousel"],
  attributes: {
    ...defaultSchema.attributes,
    icon: ["name"],
    carousel: ["images"],
    img: [...(defaultSchema.attributes?.img ?? []), "data-md-line"],
  },
};
