import { createFileRoute } from "@tanstack/react-router";
import WikiDocView from "../components/WikiDocView";

export const Route = createFileRoute("/wiki/$slug")({
  component: WikiDocView,
});
