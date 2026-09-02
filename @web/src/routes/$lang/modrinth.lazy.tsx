import { createLazyFileRoute } from "@tanstack/react-router";
import OpenAppView from "@/views/OpenAppView";

export const Route = createLazyFileRoute("/$lang/modrinth")({
  component: OpenAppView,
});
