import { createLazyFileRoute } from "@tanstack/react-router";
import AboutView from "@/views/AboutView";

export const Route = createLazyFileRoute("/$lang/about")({
  component: AboutView,
});
