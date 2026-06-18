interface TailwindProofProps {
  appName: string;
  tone?: "blue" | "violet";
}

const toneClasses = {
  blue: "from-blue-600 via-sky-500 to-cyan-400",
  violet: "from-violet-600 via-fuchsia-500 to-pink-400",
};

export function TailwindProof({ appName, tone = "blue" }: TailwindProofProps) {
  return (
    <section className="w-full max-w-xl rounded-3xl border border-white/20 bg-white/85 p-6 text-slate-950 shadow-2xl shadow-slate-950/10 backdrop-blur dark:bg-slate-950/80 dark:text-white">
      <div
        className={`mb-5 h-2 rounded-full bg-gradient-to-r ${toneClasses[tone]}`}
      />
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
        Tailwind CSS v4
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">
        {appName} 已加载共享 Tailwind 样式
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
        这个组件来自 @repo/ui，样式由子站的 Next 编译流程生成，用来验证共享包里的
        Tailwind class 能被正确扫描和输出。
      </p>
    </section>
  );
}
