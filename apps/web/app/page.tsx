import { poeticMeadowTheme } from "@repo/ui/themes";
import styles from "./page.module.css";

const theme = poeticMeadowTheme.light;

const features = [
  {
    title: "温柔记录",
    description: "把灵感、情绪和待办收纳成清晰的日常线索，减少信息噪声。",
  },
  {
    title: "陪伴式建议",
    description: "以低压、共情的方式给出下一步建议，适合 INFP 的创作节奏。",
  },
  {
    title: "轻量工作台",
    description: "保留必要操作和状态反馈，让界面保持安静、柔软又可执行。",
  },
] as const;

export default function Home() {
  return (
    <div
      className={`${styles.page} theme-poetic-meadow`}
      style={{
        color: theme.foreground,
      }}
    >
      <main className="mx-auto flex min-h-svh w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <nav className="flex items-center justify-between rounded-full border border-[var(--border)] bg-white/70 px-5 py-3 shadow-lg shadow-lime-950/5 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-[var(--primary)] text-sm font-black text-[var(--background)]">
              P
            </span>
            <div>
              <p className="text-sm font-bold">Poetic Meadow</p>
              <p className="text-xs text-[var(--muted)]">INFP assistant space</p>
            </div>
          </div>
          <a
            className="hidden rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] sm:inline-flex"
            href="http://localhost:3002/health"
          >
            API 状态
          </a>
        </nav>

        <section className="grid flex-1 gap-8 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[var(--primary)]">
              INFP Companion
            </p>
            <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-[-0.07em] text-[var(--foreground)] sm:text-7xl lg:text-8xl">
              给理想主义者的安静工作台
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              使用 Poetic Meadow 主题，将草地绿、雾粉和暖白融合成一个低刺激、
              有陪伴感的首页。适合记录灵感、整理任务和启动下一段创作。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                className="rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-bold text-[var(--background)] shadow-xl shadow-lime-800/20"
                href="/dashboard"
              >
                开始整理灵感
              </a>
              <a
                className="rounded-full border border-[var(--border)] bg-white/60 px-6 py-3 text-sm font-bold text-[var(--foreground)]"
                href="#features"
              >
                查看功能
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 -top-8 size-40 rounded-full bg-[var(--accent)] opacity-40 blur-3xl" />
            <div className="absolute -bottom-8 right-4 size-48 rounded-full bg-[var(--primary)] opacity-25 blur-3xl" />
            <section className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)]/90 p-6 shadow-2xl shadow-lime-950/10 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--muted)]">
                    今日状态
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight">
                    慢一点，也是在前进
                  </h2>
                </div>
                <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-[var(--foreground)]">
                  calm
                </span>
              </div>

              <div className="mt-8 grid gap-3">
                {["整理一个想法", "写下三句话", "完成一件小事"].map((item) => (
                  <div
                    className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white/55 p-4"
                    key={item}
                  >
                    <span className="font-semibold">{item}</span>
                    <span className="size-3 rounded-full bg-[var(--primary)]" />
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-3xl bg-[#F4C7D7]/45 p-5">
                <p className="text-sm leading-6 text-[var(--foreground)]">
                  “把复杂世界先放在门外，给自己留一块可以慢慢生长的草地。”
                </p>
              </div>
            </section>
          </div>
        </section>

        <section className="grid gap-4 pb-12 md:grid-cols-3" id="features">
          {features.map((feature) => (
            <article
              className="rounded-3xl border border-[var(--border)] bg-white/65 p-6 shadow-lg shadow-lime-950/5 backdrop-blur"
              key={feature.title}
            >
              <div className="mb-6 size-12 rounded-2xl bg-[var(--accent)]" />
              <h3 className="text-xl font-black tracking-tight">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {feature.description}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
