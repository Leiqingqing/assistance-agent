# Assistance Agent

基于 Turborepo + pnpm 的 monorepo。

## Apps

- `web`: 用户端站点，React + Next.js，默认端口 `3000`
- `admin`: 管理后台，React + Next.js，默认端口 `3001`
- `api`: 独立 API 服务，Hono + Cloudflare Workers，默认本地端口 `3002`

## Packages

- `@repo/ui`: 前端共享 UI 组件
- `@repo/eslint-config`: 共享 ESLint 配置
- `@repo/typescript-config`: 共享 TypeScript 配置

## Commands

```sh
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm check-types
```

依赖版本统一维护在 `pnpm-workspace.yaml` 的 `catalog` 中，各子应用通过 `catalog:` 引用。

## Tailwind CSS

项目采用 Tailwind CSS v4 的 CSS-first 方案：每个 Next.js 子应用负责最终编译 CSS，`@repo/ui` 负责提供共享组件、主题 tokens 和共享样式入口。

### 依赖管理

- Tailwind 相关版本统一维护在 `pnpm-workspace.yaml` 的 `catalog` 中。
- 根项目、`apps/web`、`apps/admin` 通过 `catalog:` 引用 `tailwindcss` 和 `@tailwindcss/postcss`。
- `@repo/ui` 作为共享组件包，可以直接在组件源码中使用 Tailwind class。

### 子应用配置

每个 Next.js 子应用保留自己的 `postcss.config.mjs`，由 app 编译最终 CSS：

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

每个子应用在 `app/globals.css` 中引入共享样式入口，并扫描自身源码：

```css
@import "@repo/ui/styles.css";

@source "../**/*.{ts,tsx}";
```

### 共享 UI 样式

`@repo/ui` 通过 `packages/ui/src/styles.css` 提供共享 Tailwind 入口：

```css
@import "tailwindcss";

@source "./**/*.{ts,tsx}";

@theme {
  --color-brand-primary: #2563eb;
}
```

这样 `apps/web`、`apps/admin` 和 `packages/ui/src/**/*.tsx` 中使用到的 Tailwind class 都会被对应子应用扫描并输出。

### 主题分层

- 通用设计 token、品牌色和共享主题 class 放在 `packages/ui/src/styles.css`。
- 子应用独有的 CSS 变量、页面背景和 app-specific 覆盖放在各自的 `app/globals.css`。
- 共享组件优先使用 Tailwind class 和 CSS 变量，避免把某个 app 的视觉风格硬编码进 `@repo/ui`。

推荐保持这个边界：Tailwind 编译归子应用，设计系统和共享组件归 `@repo/ui`。
