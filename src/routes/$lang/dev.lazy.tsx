import { createLazyFileRoute } from "@tanstack/react-router";
import ChestView from "../../components/ChestView";

export const Route = createLazyFileRoute("/$lang/dev")({
  component: ChestView,
});
