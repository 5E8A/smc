import { createFileRoute } from "@tanstack/react-router";
import ArchiveView from "../components/ArchiveView";

export const Route = createFileRoute("/archive")({
  component: ArchiveView,
});
