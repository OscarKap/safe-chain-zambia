import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/retention-purge")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["RETENTION_CRON_SECRET"];
        const auth = request.headers.get("authorization") ?? "";
        if (!secret || auth !== `Bearer ${secret}`) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { admin } = await import("@/lib/security.server");
        const db = await admin();
        const { data: settings } = await db
          .from("retention_settings")
          .select("auto_purge_enabled")
          .eq("id", true)
          .maybeSingle();
        if (!settings?.auto_purge_enabled) {
          return Response.json({ skipped: true, reason: "auto purge disabled" });
        }

        const { runRetentionPurge } = await import("@/lib/retention.server");
        const result = await runRetentionPurge({ dryRun: false, source: "cron", actor: null });
        return Response.json(result);
      },
    },
  },
});
