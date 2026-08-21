import { createLazyFileRoute } from "@tanstack/react-router";
import OpenAppView from "../../components/OpenAppView";

export const Route = createLazyFileRoute("/$lang/modrinth")({
  component: OpenAppView,
});
