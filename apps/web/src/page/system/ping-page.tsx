import Link from "next/link";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Separator } from "@repo/ui/separator";
import { getPingCheck } from "../../api";
import styles from "../../../app/page.module.css";

export const dynamic = "force-dynamic";

export default async function PingPage() {
  const pingCheck = await getPingCheck();
  const errorCode = pingCheck.response.ok ? "none" : pingCheck.response.error.code;

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
              shadcn/ui shared component bench
            </h1>
            <p className="mt-5 max-w-2xl text-body-lg text-muted-foreground">
              Validate that the web app can consume shared theme tokens and
              components from @repo/ui.
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

        <section className="grid flex-1 gap-6 pb-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:items-start">
          <Card className={`${styles.secondaryCard} shadow-md backdrop-blur`}>
            <CardHeader>
              <CardTitle>Request chain</CardTitle>
              <CardDescription>
                The home page calls API `/ping` through Hono RPC and validates
                both request and response with zod.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="grid gap-3 pt-6 text-body">
              <div className="rounded-lg border border-border bg-background/60 p-3">
                <p className="mb-2 font-medium">Request body</p>
                <pre className="overflow-auto whitespace-pre-wrap text-caption text-muted-foreground">
                  {JSON.stringify(pingCheck.request, null, 2)}
                </pre>
              </div>
              <div className="rounded-lg border border-border bg-background/60 p-3">
                <p className="mb-2 font-medium">Response body</p>
                <pre className="overflow-auto whitespace-pre-wrap text-caption text-muted-foreground">
                  {JSON.stringify(pingCheck.response, null, 2)}
                </pre>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2">
                <span className="font-medium">Error code</span>
                <span
                  className={`${styles.statusBadge} rounded-full px-2 py-0.5 text-caption ${
                    pingCheck.response.ok ? "text-primary" : "text-destructive"
                  }`}
                >
                  {errorCode}
                </span>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
