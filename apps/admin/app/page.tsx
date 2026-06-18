import { Button } from "@repo/ui/button";
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
          <Button appName="admin" className={styles.secondary}>
            Shared UI
          </Button>
        </div>
        <TailwindProof appName="Admin App" tone="violet" />
      </section>
    </main>
  );
}
