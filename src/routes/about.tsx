import { createFileRoute } from "@tanstack/react-router";
import AboutView from "../components/AboutView";

export const Route = createFileRoute("/about")({
  component: AboutView,
});
