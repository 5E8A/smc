import { createLazyFileRoute } from "@tanstack/react-router";
import ArchiveView from "../components/ArchiveView";

export const Route = createLazyFileRoute("/archive")({
  component: ArchiveView,
});
