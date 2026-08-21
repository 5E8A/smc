import { createLazyFileRoute } from "@tanstack/react-router";
import WikiDocView from "../components/WikiDocView";

export const Route = createLazyFileRoute("/wiki/$slug")({
  component: WikiDocView,
});
