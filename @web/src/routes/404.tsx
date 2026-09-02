import { createFileRoute } from "@tanstack/react-router";
import NotFound from "@/components/error/NotFound";

export const Route = createFileRoute("/404")({
  component: NotFound,
  head: () => ({
    meta: [{ title: "Not Found | SMC" }],
  }),
});
