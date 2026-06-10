import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/pending")({
  head: () => ({ meta: [{ title: "Awaiting approval — Safe Chain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Pending,
});

function Pending() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="card-soft max-w-lg w-full p-8 text-center">
        <Clock className="mx-auto h-12 w-12 text-brand" />
        <h1 className="mt-4 text-2xl font-bold">Awaiting Super Admin approval</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks for registering with Safe Chain. Your account is pending
          review. You'll be notified by email once approved, and you can then
          sign in.
        </p>
        <Link to="/login" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Go to sign in
        </Link>
      </div>
    </section>
  );
}
