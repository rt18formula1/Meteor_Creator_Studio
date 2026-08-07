import Link from "next/link";
import { HubHeader } from "@/components/hub/HubHeader";
import { Clock } from "lucide-react";

export function ComingSoonPage({
  appName,
}: {
  appName: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <HubHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        <Clock className="h-12 w-12 text-lumina-text-muted" />
        <h1 className="text-xl font-semibold">{appName}</h1>
        <p className="text-sm text-lumina-text-muted">近日公開予定</p>
        <Link
          href="/apps/photo"
          className="mt-4 text-sm text-lumina-accent hover:underline"
        >
          Meteor Photo を使う
        </Link>
      </main>
    </div>
  );
}
