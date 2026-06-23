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
import styles from "./page.module.css";

export default function AdminHome() {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <p className={styles.eyebrow}>Admin App</p>
        <h1>管理后台</h1>
        <p className={styles.description}>
          面向运营和管理员的 Next.js 后台应用，默认运行在 3001 端口。
        </p>
        <div className={styles.actions}>
          <a className={styles.primary} href="http://localhost:3002/health">
            检查 API
          </a>
          <Button className={styles.secondary} variant="outline">
            Shared UI
          </Button>
        </div>
        <Card className="mt-8 border-white/15 bg-slate-950/45 text-white shadow-2xl shadow-sky-950/20">
          <CardHeader>
            <CardTitle>管理员组件验证</CardTitle>
            <CardDescription className="text-slate-300">
              这里使用 @repo/ui 导出的 Button、Label、Input、Card 和
              Separator，验证 admin app 可以消费共享 Tailwind 组件。
            </CardDescription>
          </CardHeader>
          <Separator className="bg-white/15" />
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="admin-query">查询对象</Label>
              <Input
                className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                id="admin-query"
                placeholder="用户 ID / 工单 ID"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-scope">权限范围</Label>
              <Input
                className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                id="admin-scope"
                placeholder="operator / owner"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-3">
            <Button variant="ghost">重置</Button>
            <Button>执行检查</Button>
          </CardFooter>
        </Card>
        <TailwindProof appName="Admin App" tone="violet" />
      </section>
    </main>
  );
}
