import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageCircle, MessageSquare, Phone, ClipboardCheck, Share2, CalendarClock, ShieldAlert, X } from "lucide-react";
import { reports, apiErrorMessage, type ReportDetail } from "@/lib/api";
import {
  CONTACT_METHOD_LABEL, CONTACT_OUTCOMES, CONTACT_ACTIONS, REFERRAL_TYPES, FOLLOW_UP_OPTIONS,
  caseRef, firstContactMessage, referralMessage, whatsappLink, smsLink, telLink, followUpDate,
  type ReferralInput,
} from "@/lib/contact";

const INPUT = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
const BTN = "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-40 disabled:pointer-events-none";

const TIMELINE_LABEL: Record<string, string> = {
  "contact:recorded": "Survivor contacted",
  "referral:created": "Referral provided",
  "followup:scheduled": "Follow-up scheduled",
  "followup:completed": "Follow-up completed",
  "status:Assigned": "Assigned to responder",
  "status:Accepted": "Accepted by responder",
  "status:In_Progress": "In progress",
  "status:Escalated": "Escalated",
  "status:Resolved": "Case resolved",
  "status:Closed": "Case closed",
};

export function ContactReferralPanel({ r }: { r: ReportDetail }) {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<null | "contact" | "referral" | "followup">(null);
  const ref = caseRef(r.id, r.created_at);
  const phone = r.reporter_phone ?? "";
  const method = r.contact_method ?? null;
  const noContact = method === "none";
  const unsafe = r.contact_safe === false;
  const canUsePhone = !!phone && !noContact;
  const refresh = () => qc.invalidateQueries({ queryKey: ["report", r.id] });

  function confirmUnsafe(): boolean {
    if (!unsafe) return true;
    return window.confirm("The survivor said it is NOT safe to contact them this way. Continue only if you have confirmed it is now safe.");
  }

  const timeline = [
    { id: "submitted", label: "Report submitted", at: r.created_at, details: undefined as string | undefined },
    ...(r.history ?? [])
      .filter((h) => TIMELINE_LABEL[h.action])
      .map((h) => ({ id: h.id, label: TIMELINE_LABEL[h.action], at: h.created_at, details: h.details })),
  ];

  return (
    <div className="card-soft p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Contact &amp; Referral</h2>
        <span className="font-mono text-xs text-muted-foreground">{ref}</span>
      </div>

      {(noContact || unsafe) && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <ShieldAlert className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
          <p>{noContact ? "The survivor does not want to be contacted. Do not reach out; record any referral given through other channels." : "Not safe to contact by this method. Do not contact unless safety is confirmed."}</p>
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <Item label="Preferred contact" value={method ? CONTACT_METHOD_LABEL[method] ?? method : "Not given"} />
        <Item label="Contact number" value={noContact ? "—" : phone || "—"} />
        <Item label="Safe to contact" value={r.contact_safe == null ? "Not stated" : r.contact_safe ? "Yes" : "No"} strong={unsafe} />
        <Item label="Last contact" value={r.last_contact_at ? new Date(r.last_contact_at).toLocaleString() : "Never"} />
        <Item label="Last outcome" value={r.last_contact_outcome ?? "—"} />
        <Item label="Next follow-up" value={r.next_follow_up ? new Date(r.next_follow_up).toLocaleDateString() : "Not scheduled"} />
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <a className={BTN} aria-disabled={!canUsePhone} href={canUsePhone ? whatsappLink(phone, firstContactMessage(ref, "whatsapp")) : undefined}
          target="_blank" rel="noreferrer" onClick={(e) => { if (!canUsePhone || !confirmUnsafe()) e.preventDefault(); }}
          style={!canUsePhone ? { opacity: 0.4, pointerEvents: "none" } : undefined}>
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </a>
        <a className={BTN} href={canUsePhone ? smsLink(phone, firstContactMessage(ref, "sms")) : undefined}
          onClick={(e) => { if (!canUsePhone || !confirmUnsafe()) e.preventDefault(); }}
          style={!canUsePhone ? { opacity: 0.4, pointerEvents: "none" } : undefined}>
          <MessageSquare className="h-3.5 w-3.5" /> SMS
        </a>
        <a className={BTN} href={canUsePhone ? telLink(phone) : undefined}
          onClick={(e) => { if (!canUsePhone || !confirmUnsafe()) e.preventDefault(); }}
          style={!canUsePhone ? { opacity: 0.4, pointerEvents: "none" } : undefined}>
          <Phone className="h-3.5 w-3.5" /> Call
        </a>
        <span className="w-full sm:hidden" />
        <button className={BTN} onClick={() => setDialog("contact")}><ClipboardCheck className="h-3.5 w-3.5" /> Record contact</button>
        <button className={BTN} onClick={() => setDialog("referral")}><Share2 className="h-3.5 w-3.5" /> Create referral</button>
        <button className={BTN} onClick={() => setDialog("followup")}><CalendarClock className="h-3.5 w-3.5" /> Schedule follow-up</button>
      </div>

      <h3 className="mt-6 text-xs uppercase tracking-wide text-muted-foreground">Case timeline</h3>
      <ol className="mt-2 border-l border-border pl-4 space-y-3">
        {timeline.map((t) => (
          <li key={t.id} className="relative text-sm">
            <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
            <p className="font-medium">{t.label}</p>
            <p className="text-xs text-muted-foreground">{new Date(t.at).toLocaleString()}</p>
            {t.details && <p className="mt-0.5 text-xs whitespace-pre-wrap">{t.details}</p>}
          </li>
        ))}
      </ol>

      {dialog === "contact" && <RecordContactDialog id={r.id} onClose={() => setDialog(null)} onDone={() => { setDialog(null); refresh(); }} />}
      {dialog === "referral" && <ReferralDialog id={r.id} caseRefText={ref} phone={canUsePhone ? phone : ""} confirmUnsafe={confirmUnsafe} onClose={() => setDialog(null)} onDone={() => { setDialog(null); refresh(); }} />}
      {dialog === "followup" && <FollowUpDialog id={r.id} onClose={() => setDialog(null)} onDone={() => { setDialog(null); refresh(); }} />}
    </div>
  );
}

function Item({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 break-words ${strong ? "font-bold text-destructive" : ""}`}>{value}</dd>
    </div>
  );
}

function FollowUpPicker({ option, setOption, custom, setCustom }: { option: string; setOption: (v: string) => void; custom: string; setCustom: (v: string) => void }) {
  return (
    <>
      <select value={option} onChange={(e) => setOption(e.target.value)} className={INPUT}>
        {FOLLOW_UP_OPTIONS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
      </select>
      {option === "custom" && <input type="date" value={custom} onChange={(e) => setCustom(e.target.value)} className={INPUT} />}
    </>
  );
}

function RecordContactDialog({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: () => void }) {
  const [outcome, setOutcome] = useState<string>(CONTACT_OUTCOMES[0]);
  const [actions, setActions] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [fu, setFu] = useState("none");
  const [custom, setCustom] = useState("");
  const save = useMutation({
    mutationFn: () => reports.recordContact(id, { outcome, actions, note: note.slice(0, 1000), followUp: followUpDate(fu, custom) }),
    onSuccess: () => { toast.success("Contact recorded"); onDone(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  return (
    <Modal title="Record contact" onClose={onClose}>
      <label className="text-xs uppercase tracking-wide text-muted-foreground">Contact outcome</label>
      <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className={INPUT}>
        {CONTACT_OUTCOMES.map((o) => <option key={o}>{o}</option>)}
      </select>
      <p className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">Action taken</p>
      <div className="mt-1 grid sm:grid-cols-2 gap-1.5">
        {CONTACT_ACTIONS.map((a) => (
          <label key={a} className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-xs cursor-pointer">
            <input type="checkbox" checked={actions.includes(a)} onChange={() => setActions((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a])} />
            {a}
          </label>
        ))}
      </div>
      <label className="mt-4 block text-xs uppercase tracking-wide text-muted-foreground">Private note</label>
      <textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Short note — do not paste message conversations." className={INPUT} />
      <label className="mt-4 block text-xs uppercase tracking-wide text-muted-foreground">Follow-up</label>
      <FollowUpPicker option={fu} setOption={setFu} custom={custom} setCustom={setCustom} />
      <Actions onClose={onClose} onSave={() => save.mutate()} pending={save.isPending} disabled={fu === "custom" && !custom} />
    </Modal>
  );
}

function ReferralDialog({ id, caseRefText, phone, confirmUnsafe, onClose, onDone }: { id: string; caseRefText: string; phone: string; confirmUnsafe: () => boolean; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState<ReferralInput>({ type: REFERRAL_TYPES[0], facility: "", location: "", contact: "", service: "", instructions: "" });
  const set = (k: keyof ReferralInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value.slice(0, 300) });
  const msg = referralMessage(caseRefText, f);
  const save = useMutation({
    mutationFn: () => reports.recordReferral(id, `${f.type} — ${f.facility}${f.location ? `, ${f.location}` : ""}${f.contact ? ` (${f.contact})` : ""}`),
    onSuccess: () => { toast.success("Referral recorded"); onDone(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const send = (href: string) => { if (confirmUnsafe()) window.open(href, "_blank", "noopener"); };
  return (
    <Modal title="Create referral" onClose={onClose}>
      <div className="grid gap-3">
        <label className="text-sm">Referral type<select value={f.type} onChange={set("type")} className={INPUT}>{REFERRAL_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label className="text-sm">Facility / organisation *<input value={f.facility} onChange={set("facility")} className={INPUT} /></label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">Location<input value={f.location} onChange={set("location")} className={INPUT} /></label>
          <label className="text-sm">Contact number<input value={f.contact} onChange={set("contact")} className={INPUT} /></label>
        </div>
        <label className="text-sm">Service provided<input value={f.service} onChange={set("service")} placeholder="e.g. GBV/SRHR Counselling" className={INPUT} /></label>
        <label className="text-sm">Additional instructions<textarea rows={2} value={f.instructions} onChange={set("instructions")} className={INPUT} /></label>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Message preview</p>
          <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs font-sans">{msg}</pre>
          <div className="mt-2 flex flex-wrap gap-2">
            <button className={BTN} disabled={!phone || !f.facility} onClick={() => send(whatsappLink(phone, msg))}><MessageCircle className="h-3.5 w-3.5" /> Send via WhatsApp</button>
            <button className={BTN} disabled={!phone || !f.facility} onClick={() => send(smsLink(phone, msg))}><MessageSquare className="h-3.5 w-3.5" /> Send via SMS</button>
            <button className={BTN} disabled={!f.facility} onClick={() => { void navigator.clipboard?.writeText(msg); toast.success("Copied"); }}>Copy</button>
          </div>
          {!phone && <p className="mt-1 text-xs text-muted-foreground">No contact number available — share the referral through another safe channel.</p>}
        </div>
      </div>
      <Actions onClose={onClose} onSave={() => save.mutate()} pending={save.isPending} disabled={!f.facility.trim()} saveLabel="Record referral provided" />
    </Modal>
  );
}

function FollowUpDialog({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: () => void }) {
  const [fu, setFu] = useState("24h");
  const [custom, setCustom] = useState("");
  const save = useMutation({
    mutationFn: () => reports.scheduleFollowUp(id, followUpDate(fu, custom)),
    onSuccess: () => { toast.success("Follow-up updated"); onDone(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  return (
    <Modal title="Schedule follow-up" onClose={onClose}>
      <p className="text-sm text-muted-foreground">Choose "No follow-up required" to mark the follow-up as completed.</p>
      <FollowUpPicker option={fu} setOption={setFu} custom={custom} setCustom={setCustom} />
      <Actions onClose={onClose} onSave={() => save.mutate()} pending={save.isPending} disabled={fu === "custom" && !custom} />
    </Modal>
  );
}

function Actions({ onClose, onSave, pending, disabled, saveLabel = "Save" }: { onClose: () => void; onSave: () => void; pending: boolean; disabled?: boolean; saveLabel?: string }) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm">Cancel</button>
      <button disabled={pending || disabled} onClick={onSave} className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60">{pending ? "Saving…" : saveLabel}</button>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card shadow-xl border border-border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
