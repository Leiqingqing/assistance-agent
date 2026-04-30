import { Button } from "@repo/ui/button";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <p className={styles.eyebrow}>Web App</p>
        <h1>用户端站点</h1>
        <p className={styles.description}>
          面向用户访问的 Next.js 前端应用，后续可以在这里承载产品官网、
          登录入口和用户工作台。
        </p>

        <div className={styles.ctas}>
          <a className={styles.primary} href="/dashboard">
            进入用户端
          </a>
          <a className={styles.secondary} href="http://localhost:3002/health">
            API 健康检查
          </a>
        </div>
        <Button appName="web" className={styles.secondary}>
          Shared UI
        </Button>
      </main>
    </div>
  );
}
