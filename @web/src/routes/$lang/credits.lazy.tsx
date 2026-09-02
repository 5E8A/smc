import { createLazyFileRoute } from "@tanstack/react-router";
import CreditsView from "@/views/CreditsView";

export const Route = createLazyFileRoute("/$lang/credits")({
  component: CreditsView,
});
