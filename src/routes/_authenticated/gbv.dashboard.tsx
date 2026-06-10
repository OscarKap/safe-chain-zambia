import { createFileRoute } from "@tanstack/react-router";
import { makeRoleDashboard } from "./responder.dashboard";

export const Route = createFileRoute("/_authenticated/gbv/dashboard")({
  head: () => ({ meta: [{ title: "GBV Officer dashboard — Safe Chain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: makeRoleDashboard("gbv_officer", "GBV Officer Dashboard"),
});
