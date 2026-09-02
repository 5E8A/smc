import { createLazyFileRoute } from "@tanstack/react-router";
import ArticleView from "@/views/ArticleView";

export const Route = createLazyFileRoute("/$lang/post/$slug")({
  component: function LangPostSlugComponent() {
    const { body } = Route.useLoaderData();
    return <ArticleView body={body} />;
  },
});
