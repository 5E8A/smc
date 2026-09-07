import { useSyncExternalStore } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import OpenAppView from "@/views/OpenAppView";

const emptySubscribe = () => () => {};

export const Route = createLazyFileRoute("/$lang/modrinth")({
  component: function LangModrinthComponent() {
    const { type, slug } = Route.useSearch();
    const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
    return <OpenAppView search={isClient ? { type, slug } : { type: null, slug: null }} />;
  },
});
