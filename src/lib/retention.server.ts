// Server-only retention purge: deletes expired audit logs, attachments,
// notifications and rate-limit events, then removes orphaned storage objects.
import { admin } from "@/lib/security.server";

export interface PurgeResult {
  dry_run: boolean;
  audit_logs: number;
  attachments: number;
  notifications: number;
  rate_limits: number;
  storage_removed: number;
}

export async function runRetentionPurge(opts: {
  dryRun: boolean;
  source: string;
  actor?: string | null;
}): Promise<PurgeResult> {
  const db = await admin();
  const { data, error } = await db.rpc("run_retention_purge" as never, {
    _dry_run: opts.dryRun,
    _source: opts.source,
    _actor: opts.actor ?? null,
  } as never);
  if (error) throw new Error(error.message);

  const result = (data ?? {}) as {
    dry_run?: boolean;
    audit_logs?: number;
    attachments?: number;
    notifications?: number;
    rate_limits?: number;
    storage_paths?: string[];
  };

  let storageRemoved = 0;
  const paths = result.storage_paths ?? [];
  if (!opts.dryRun && paths.length > 0) {
    for (let i = 0; i < paths.length; i += 100) {
      const chunk = paths.slice(i, i + 100);
      const { error: rmError } = await db.storage.from("case-attachments").remove(chunk);
      if (!rmError) storageRemoved += chunk.length;
    }
  }

  return {
    dry_run: !!result.dry_run,
    audit_logs: result.audit_logs ?? 0,
    attachments: result.attachments ?? 0,
    notifications: result.notifications ?? 0,
    rate_limits: result.rate_limits ?? 0,
    storage_removed: storageRemoved,
  };
}
