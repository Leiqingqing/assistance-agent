import Link from "next/link";
import { Button } from "@repo/ui/button";
import styles from "@app/page.module.css";
import { SystemQueryDemo } from "./system-query-demo";

export const dynamic = "force-dynamic";

export default function PingPage() {
  return (
    <div className={`${styles.page} theme-poetic-meadow`}>
      <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 py-8 sm:py-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p
              className={`${styles.eyebrow} inline-flex rounded-full border border-border px-3 py-1 text-caption uppercase text-primary shadow-sm`}
            >
              @repo/ui + Tailwind CSS
            </p>
            <h1 className="mt-5 text-display text-foreground">
              TanStack Query system check
            </h1>
            <p className="mt-5 max-w-2xl text-body-lg text-muted-foreground">
              Health is cached with useQuery. Ping is a button-triggered
              useMutation that refreshes the health query after success.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="sm">Theme primary</Button>
            <Button size="sm" variant="outline">
              Responsive check
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/tailwind-design">Token plan</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <a href="#component-checklist">Slot asChild</a>
            </Button>
          </div>
        </header>

        <SystemQueryDemo />
      </main>
    </div>
  );
}
