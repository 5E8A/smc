import { createLazyFileRoute } from "@tanstack/react-router";
import WikiView from "@/views/WikiView";

export const Route = createLazyFileRoute("/$lang/wiki/")({
  component: WikiView,
});
