import Link from "next/link";
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
import styles from "./page.module.css";

const components = ["Button", "Slot", "Label", "Input", "Card", "Separator"] as const;

export default function Home() {
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
              shadcn/ui 共享组件验证台
            </h1>
            <p className="mt-5 max-w-2xl text-body-lg text-muted-foreground">
              使用共享主题色和响应式布局，验证 web app 可以消费 @repo/ui
              中的 Button、Slot、Label、Input、Card 和 Separator。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="sm">主题主色</Button>
            <Button size="sm" variant="outline">
              响应式验证
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/tailwind-design">Token 方案</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <a href="#component-checklist">Slot asChild</a>
            </Button>
          </div>
        </header>

        <section className="grid flex-1 gap-6 pb-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:items-start">
          <Card
            className={`${styles.primaryCard} overflow-hidden shadow-lg backdrop-blur`}
          >
            <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary/50" />
            <CardHeader>
              <CardTitle>创建验证记录</CardTitle>
              <CardDescription>
                表单控件来自 @repo/ui，语义色来自共享主题 token。
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="title">标题</Label>
                <Input id="title" placeholder="共享组件验证台" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="owner">负责人</Label>
                <Input id="owner" placeholder="web app" />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="status">状态</Label>
                <Input id="status" placeholder="ready / testing / done" />
              </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline">取消</Button>
              <Button>提交验证</Button>
            </CardFooter>
          </Card>

          <aside className="grid gap-6">
            <Card
              className={`${styles.secondaryCard} shadow-md backdrop-blur`}
            >
              <CardHeader>
                <CardTitle>主题色</CardTitle>
                <CardDescription>
                  当前页面挂载 `theme-poetic-meadow`，组件自动读取 CSS 变量。
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="rounded-xl bg-primary p-4 text-primary-foreground">
                  <p className="text-body font-semibold">Primary</p>
                  <p className="mt-1 text-caption opacity-85">按钮、强调状态与焦点色</p>
                </div>
                <div
                  className={`${styles.accentPanel} rounded-xl border border-border p-4 text-foreground`}
                >
                  <p className="text-body font-semibold">Accent</p>
                  <p className="mt-1 text-caption text-muted-foreground">
                    装饰渐变和辅助视觉层次
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              id="component-checklist"
              className={`${styles.secondaryCard} shadow-md backdrop-blur`}
            >
              <CardHeader>
                <CardTitle>组件清单</CardTitle>
                <CardDescription>
                  第一批基础组件已经从共享包导入并在首页渲染。
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="grid gap-3 pt-6">
                {components.map((item) => (
                  <div
                    className={`${styles.listItem} flex items-center justify-between rounded-lg border border-border px-3 py-2 text-body`}
                    key={item}
                  >
                    <span className="font-medium">{item}</span>
                    <span
                      className={`${styles.statusBadge} rounded-full px-2 py-0.5 text-caption text-primary`}
                    >
                      loaded
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>
    </div>
  );
}
