import { createFileRoute } from "@tanstack/react-router";
import WikiView from "../../components/WikiView";

export const Route = createFileRoute("/wiki/")({
  component: WikiView,
});
