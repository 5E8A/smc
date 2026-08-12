import { createFileRoute } from "@tanstack/react-router";
import ArticleView from "../components/ArticleView";

export const Route = createFileRoute("/post/$slug")({
  component: ArticleView,
});
