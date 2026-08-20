import { createLazyFileRoute } from "@tanstack/react-router";
import ArticleView from "../../components/ArticleView";

export const Route = createLazyFileRoute("/$lang/post/$slug")({
  component: ArticleView,
});
