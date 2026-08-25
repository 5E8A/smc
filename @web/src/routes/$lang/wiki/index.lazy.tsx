import { createLazyFileRoute } from "@tanstack/react-router";
import WikiView from "../../../components/WikiView";

export const Route = createLazyFileRoute("/$lang/wiki/")({
  component: WikiView,
});
