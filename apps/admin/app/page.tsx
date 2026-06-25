import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Separator } from "@repo/ui/separator";
import { TailwindProof } from "@repo/ui/tailwind-proof";
import { getServerApiBaseUrl } from "../.env.server";
import styles from "./page.module.css";

export default function AdminHome() {
  const apiHealthUrl = new URL("/health", getServerApiBaseUrl()).toString();

  return (
    <main className={`${styles.page} theme-poetic-meadow dark`}>
      <section className={styles.panel}>
        <p className={styles.eyebrow}>Admin App</p>
        <h1>Admin console</h1>
        <p className={styles.description}>
          Next.js admin app for operators and administrators. It runs on port
          3001 by default.
        </p>
        <div className={styles.actions}>
          <a className={styles.primary} href={apiHealthUrl}>
            Check API
          </a>
          <Button className={styles.secondary} variant="outline">
            Shared UI
          </Button>
        </div>
        <Card className="mt-8 bg-card/80 shadow-lg">
          <CardHeader>
            <CardTitle>Admin component check</CardTitle>
            <CardDescription>
              This page uses Button, Label, Input, Card, and Separator from
              @repo/ui to validate shared Tailwind components.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="admin-query">Query target</Label>
              <Input id="admin-query" placeholder="User ID / ticket ID" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-scope">Access scope</Label>
              <Input id="admin-scope" placeholder="operator / owner" />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-3">
            <Button variant="ghost">Reset</Button>
            <Button>Run check</Button>
          </CardFooter>
        </Card>
        <TailwindProof appName="Admin App" tone="violet" />
      </section>
    </main>
  );
}