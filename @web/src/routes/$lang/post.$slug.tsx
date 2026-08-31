import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPostAvailability, getPostBody, getPostBySlug } from "../../data/posts";

const suffix = " | SMC";

export const Route = createFileRoute("/$lang/post/$slug")({
  beforeLoad: ({ params }) => {
    const availability = getPostAvailability(params.slug);
    if (!availability.en && !availability.pl) {
      throw notFound();
    }
  },
  loader: ({ params }) => {
    const lang = params.lang === "pl" ? "pl" : "en";
    const body = getPostBody(params.slug, lang);
    const post = getPostBySlug(params.slug, lang);
    return { body, title: post?.title };
  },
  head: ({ loaderData }) => {
    const { title } = loaderData as { body: string | null; title: string | undefined };
    return {
      meta: [{ title: title ? `${title}${suffix}` : undefined }],
    };
  },
});
