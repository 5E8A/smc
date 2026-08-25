import { createFileRoute } from "@tanstack/react-router";
import HomeView from "../../components/HomeView";

export const Route = createFileRoute("/$lang/")({
  component: HomeView,
});
