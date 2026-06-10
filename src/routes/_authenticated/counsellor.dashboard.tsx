import { createFileRoute } from "@tanstack/react-router";
import { makeRoleDashboard } from "./responder.dashboard";

export const Route = createFileRoute("/_authenticated/counsellor/dashboard")({
  head: () => ({ meta: [{ title: "Counsellor dashboard — Safe Chain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: makeRoleDashboard("counsellor", "Counsellor Dashboard"),
});
