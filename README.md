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
