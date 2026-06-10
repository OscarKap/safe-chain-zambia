import { createFileRoute } from "@tanstack/react-router";
import { makeRoleDashboard } from "./responder.dashboard";

export const Route = createFileRoute("/_authenticated/developer/dashboard")({
  head: () => ({ meta: [{ title: "Developer dashboard — Safe Chain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: makeRoleDashboard("developer", "Developer Dashboard"),
});
