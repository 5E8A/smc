import { createLazyFileRoute } from "@tanstack/react-router";
import ArticleView from "../components/ArticleView";

export const Route = createLazyFileRoute("/post/$slug")({
  component: ArticleView,
});
