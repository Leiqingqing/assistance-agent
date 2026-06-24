import type { CSSProperties } from "react";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Separator } from "@repo/ui/separator";
import {
  poeticMeadowTheme,
  type ColorScale,
  type RadiusTokens,
  type ShadowTokens,
  type ThemeColorGroups,
  type ThemeTokens,
  type TypographyTokens,
} from "@repo/ui/themes";

type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

const scaleLabels = {
  brand: "品牌紫",
  meadow: "草地绿",
  blush: "花瓣粉",
  earth: "泥土棕",
} as const satisfies Record<keyof ThemeTokens["scales"], string>;

const shadowLabels = {
  xs: "XS",
  sm: "SM",
  md: "MD",
  lg: "LG",
  glow: "Glow",
  focus: "Focus",
} as const satisfies Record<keyof ShadowTokens, string>;

const radiusLabels = {
  xs: "XS",
  sm: "SM",
  md: "MD",
  lg: "LG",
  xl: "XL",
  "2xl": "2XL",
  "3xl": "3XL",
  full: "Full",
} as const satisfies Record<keyof RadiusTokens, string>;

const typographyLabels = {
  caption: "Caption",
  body: "Body",
  bodyLarge: "Body Large",
  title: "Title",
  display: "Display",
} as const satisfies Record<keyof TypographyTokens["scale"], string>;

const colorGroupLabels = {
  brand: "Brand",
  surface: "Surface",
  content: "Content",
  border: "Border",
  state: "State",
} as const satisfies Record<keyof ThemeColorGroups, string>;

function getThemeStyle(tokens: ThemeTokens): ThemeStyle {
  return {
    "--background": tokens.background,
    "--foreground": tokens.foreground,
    "--card": tokens.card,
    "--card-foreground": tokens.cardForeground,
    "--popover": tokens.popover,
    "--popover-foreground": tokens.popoverForeground,
    "--primary": tokens.primary,
    "--primary-foreground": tokens.primaryForeground,
    "--secondary": tokens.secondary,
    "--secondary-foreground": tokens.secondaryForeground,
    "--accent": tokens.accent,
    "--accent-foreground": tokens.accentForeground,
    "--muted": tokens.muted,
    "--muted-foreground": tokens.mutedForeground,
    "--destructive": tokens.destructive,
    "--destructive-foreground": tokens.destructiveForeground,
    "--border": tokens.border,
    "--input": tokens.input,
    "--ring": tokens.ring,
  };
}

function ColorSwatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="h-16" style={{ background: value }} />
      <div className="grid gap-1 p-3">
        <span className="text-caption text-foreground">{name}</span>
        <span className="font-mono text-caption text-muted-foreground">
          {value}
        </span>
      </div>
    </div>
  );
}

function TokenGroup({
  label,
  tokens,
}: {
  label: string;
  tokens: Record<string, string>;
}) {
  return (
    <div className="grid gap-3">
      <div>
        <h3 className="text-title text-foreground">
          {label}
        </h3>
        <p className="mt-1 text-body text-muted-foreground">
          @theme 中对应 `--color-{label.toLowerCase()}-*`
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Object.entries(tokens).map(([name, value]) => (
          <ColorSwatch key={name} name={name} value={value} />
        ))}
      </div>
    </div>
  );
}

function ScaleRow({ label, scale }: { label: string; scale: ColorScale }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-body font-semibold text-foreground">{label}</p>
        <p className="font-mono text-caption text-muted-foreground">50-900</p>
      </div>
      <div className="grid grid-cols-5 overflow-hidden rounded-xl border border-border sm:grid-cols-10">
        {Object.entries(scale).map(([step, color]) => (
          <div className="grid gap-2 p-2" key={step} style={{ background: color }}>
            <span className="text-caption text-content-title/65">{step}</span>
            <span className="font-mono text-caption text-content-title/55">{color}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShadowGrid({ shadows }: { shadows: ShadowTokens }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(shadowLabels).map(([key, label]) => (
        <div
          className="rounded-xl border border-border bg-card p-4"
          key={key}
          style={{ boxShadow: shadows[key as keyof ShadowTokens] }}
        >
          <p className="text-body font-semibold text-foreground">{label}</p>
          <p className="mt-2 font-mono text-caption text-muted-foreground">
            {shadows[key as keyof ShadowTokens]}
          </p>
        </div>
      ))}
    </div>
  );
}

function RadiusGrid({ radius }: { radius: RadiusTokens }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Object.entries(radiusLabels).map(([key, label]) => (
        <div
          className="border border-border bg-card p-4"
          key={key}
          style={{ borderRadius: radius[key as keyof RadiusTokens] }}
        >
          <div
            className="mb-4 h-16 bg-secondary"
            style={{ borderRadius: radius[key as keyof RadiusTokens] }}
          />
          <p className="text-body font-semibold text-foreground">{label}</p>
          <p className="mt-1 font-mono text-caption text-muted-foreground">
            {radius[key as keyof RadiusTokens]}
          </p>
        </div>
      ))}
    </div>
  );
}

function TypographyGrid({ typography }: { typography: TypographyTokens }) {
  return (
    <div className="grid gap-4">
      {Object.entries(typography.scale).map(([key, step]) => (
        <div
          className="rounded-2xl border border-border bg-card p-4"
          key={key}
        >
          <p className="font-mono text-caption text-muted-foreground">
            {typographyLabels[key as keyof TypographyTokens["scale"]]} /{" "}
            {step.fontSize} / {step.lineHeight}
          </p>
          <p
            className="mt-2 text-foreground"
            style={{
              fontSize: step.fontSize,
              fontWeight: step.fontWeight,
              letterSpacing: step.letterSpacing,
              lineHeight: step.lineHeight,
            }}
          >
            温柔的陪伴体验，从清晰的信息层级开始。
          </p>
        </div>
      ))}
    </div>
  );
}

const selectedTheme = poeticMeadowTheme;

const designPrinciples = [
  {
    title: "亲密但不黏腻",
    description: "用粉紫和樱草粉传递陪伴感，避免高饱和粉色带来的甜腻和疲劳。",
  },
  {
    title: "自然底色承托情绪",
    description: "背景继续使用 surface.page，保留草地感和呼吸感，让情绪色只做重点表达。",
  },
  {
    title: "低压交互反馈",
    description: "阴影和焦点环使用低透明度粉紫，强调当前状态但不制造压迫感。",
  },
] as const;

const tokenRoles = [
  {
    name: "Primary",
    token: "primary",
    usage: "品牌按钮、当前选中、关键行动",
  },
  {
    name: "Secondary",
    token: "secondary",
    usage: "情绪化背景、陪伴提示、轻量卡片",
  },
  {
    name: "Accent",
    token: "accent",
    usage: "草地辅助色、成功倾向、自然装饰",
  },
  {
    name: "Muted",
    token: "muted",
    usage: "弱背景、信息容器、低优先级区域",
  },
] as const;

export default function TailwindDesignPage() {
  const theme = selectedTheme;
  const tokens = theme.light;

  return (
    <main
      className="min-h-svh bg-background px-5 py-8 text-foreground sm:px-8 lg:px-10"
      style={getThemeStyle(tokens)}
    >
      <div className="mx-auto grid w-full max-w-7xl gap-8">
        <header
          className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-lg sm:p-8 lg:p-10"
        >
          <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
          <p className="text-caption uppercase text-primary">
            Selected Scheme / 05
          </p>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <h1 className="text-display">
                {theme.name}
              </h1>
              <p className="mt-4 max-w-3xl text-body-lg text-muted-foreground">
                {theme.concept} 基于 brand.500 与 surface.page，强化粉紫、
                樱草粉和草地绿之间的情绪层次。
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/">返回组件验证台</Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {designPrinciples.map((principle) => (
              <div
                className="rounded-2xl border border-border bg-muted p-4"
                key={principle.title}
              >
                <p className="font-semibold text-foreground">
                  {principle.title}
                </p>
                <p className="mt-2 text-body text-muted-foreground">
                  {principle.description}
                </p>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <Card className="overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
            <CardHeader>
              <CardTitle>产品场景示例</CardTitle>
              <CardDescription>{theme.usage}</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="grid gap-5 pt-6">
              <div className="rounded-3xl bg-secondary p-5 text-secondary-foreground">
                <p className="text-body font-semibold">今日陪伴提示</p>
                <p className="mt-3 text-title">
                  慢一点也没关系，我们先从一句话开始。
                </p>
                <p className="mt-3 text-body opacity-80">
                  Secondary 用于情绪化提示区域，既有亲密感，也不会抢走主要行动。
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="companion-topic">想聊的话题</Label>
                  <Input id="companion-topic" placeholder="今天让我有点累的事" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="companion-mood">当前心情</Label>
                  <Input id="companion-mood" placeholder="soft / quiet / hopeful" />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button>开始记录</Button>
                <Button variant="outline">稍后再说</Button>
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  variant="ghost"
                >
                  给我一点鼓励
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Token 角色</CardTitle>
              <CardDescription>为陪伴型体验约定主要语义色的职责。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {tokenRoles.map((role) => (
                <div
                  className="grid grid-cols-[4rem_1fr] gap-3 rounded-2xl border border-border bg-card p-3"
                  key={role.token}
                >
                  <div
                    className="h-16 rounded-xl"
                    style={{ background: tokens[role.token] }}
                  />
                  <div>
                    <p className="font-semibold text-foreground">
                      {role.name}
                    </p>
                    <p className="font-mono text-caption text-muted-foreground">
                      {role.token}: {tokens[role.token]}
                    </p>
                    <p className="mt-2 text-body text-muted-foreground">
                      {role.usage}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <Card>
            <CardHeader>
              <CardTitle>职责分组</CardTitle>
              <CardDescription>
                颜色体系按 Brand、Surface、Content、Border、State 分组管理。
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {Object.entries(tokens.colors).map(([key, group]) => (
                <TokenGroup
                  key={key}
                  label={colorGroupLabels[key as keyof ThemeColorGroups]}
                  tokens={group as Record<string, string>}
                />
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-5">
            <Card>
              <CardHeader>
                <CardTitle>色阶</CardTitle>
                <CardDescription>
                  品牌紫固定锚点为 brand.500；花瓣粉负责情绪，草地绿负责自然感。
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5">
                {Object.entries(tokens.scales).map(([key, scale]) => (
                  <ScaleRow
                    key={key}
                    label={scaleLabels[key as keyof ThemeTokens["scales"]]}
                    scale={scale}
                  />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>阴影</CardTitle>
                <CardDescription>
                  使用粉紫与花瓣粉的低透明度阴影，适合卡片、浮层和焦点态。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ShadowGrid shadows={tokens.shadows} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>圆角</CardTitle>
                <CardDescription>
                  圆角用于表达柔和边界，容器和控件保持一致的亲密感。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadiusGrid radius={tokens.radius} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Typography</CardTitle>
                <CardDescription>
                  字体层级强调可读性，标题收紧字距，正文保持舒展行高。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TypographyGrid typography={tokens.typography} />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
