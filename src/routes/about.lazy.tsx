import { createLazyFileRoute } from "@tanstack/react-router";
import AboutView from "../components/AboutView";

export const Route = createLazyFileRoute("/about")({
  component: AboutView,
});
