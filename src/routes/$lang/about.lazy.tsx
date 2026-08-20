import { createLazyFileRoute } from "@tanstack/react-router";
import AboutView from "../../components/AboutView";

export const Route = createLazyFileRoute("/$lang/about")({
  component: AboutView,
});
