import { createLazyFileRoute } from "@tanstack/react-router";
import CreditsView from "../../components/CreditsView";

export const Route = createLazyFileRoute("/$lang/credits")({
  component: CreditsView,
});
