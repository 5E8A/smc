import { createLazyFileRoute } from "@tanstack/react-router";
import ArchiveView from "@/views/ArchiveView";

export const Route = createLazyFileRoute("/$lang/archive")({
  component: ArchiveView,
});
