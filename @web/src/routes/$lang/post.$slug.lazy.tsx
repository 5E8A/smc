import { createLazyFileRoute } from "@tanstack/react-router";
import ArticleView from "../../components/ArticleView";

export const Route = createLazyFileRoute("/$lang/post/$slug")({
  component: function LangPostSlugComponent() {
    const { body } = Route.useLoaderData();
    return <ArticleView body={body} />;
  },
});
