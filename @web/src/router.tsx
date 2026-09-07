import { createRouter } from "@tanstack/react-router";
import { SITE_BASE_PATH } from "@smc/shared/constants";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createRouter({
    routeTree,
    basepath: SITE_BASE_PATH,
    scrollRestoration: true,
    defaultViewTransition: true,
  });
  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
