interface TailwindProofProps {
  appName: string;
  tone?: "blue" | "violet";
}

const toneClasses = {
  blue: "from-state-info via-primary to-accent",
  violet: "from-brand-700 via-primary to-secondary",
};

export function TailwindProof({ appName, tone = "blue" }: TailwindProofProps) {
  return (
    <section className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-lg backdrop-blur">
      <div
        className={`mb-5 h-2 rounded-full bg-gradient-to-r ${toneClasses[tone]}`}
      />
      <p className="text-caption uppercase text-muted-foreground">
        Tailwind CSS v4
      </p>
      <h2 className="mt-2 text-title">
        {appName} 已加载共享 Tailwind 样式
      </h2>
      <p className="mt-3 text-body text-muted-foreground">
        这个组件来自 @repo/ui，样式由子站的 Next 编译流程生成，用来验证共享包里的
        Tailwind class 能被正确扫描和输出。
      </p>
    </section>
  );
}
