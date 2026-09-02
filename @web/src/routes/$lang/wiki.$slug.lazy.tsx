import { createLazyFileRoute } from "@tanstack/react-router";
import WikiDocView from "@/views/WikiDocView";

export const Route = createLazyFileRoute("/$lang/wiki/$slug")({
  component: function LangWikiSlugComponent() {
    const { body } = Route.useLoaderData();
    return <WikiDocView body={body} />;
  },
});
