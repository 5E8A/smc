import { createRootRoute } from "@tanstack/react-router";
import RootLayout from "../components/RootLayout";
import NotFound from "../components/NotFound";

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});
