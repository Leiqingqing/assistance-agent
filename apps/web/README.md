# Web App

用户端 Next.js 应用，默认运行在 `3000` 端口。

## 开发

```sh
pnpm --filter web dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看页面。

## 目录划分

Web 应用统一使用 `src/api` 与 `src/page` 分层：

- `src/api` 只放接口调用逻辑，按 `system`、`catalog`、`user`、`order` 分域。
- 一个接口文件只管理一个后端 API 接口，例如 `src/api/system/ping.ts` 只处理 `/ping`。
- 每个域可以用自己的 `index.ts` 聚合域内接口，所有接口必须在 `src/api/index.ts` 聚合并统一导出。
- `src/page` 只放页面相关逻辑，也按 `system`、`catalog`、`user`、`order` 分域。
- 一个页面最多只调用一个后端接口，页面需要通过 `src/api/index.ts` 的统一导出获取接口能力。
- Next.js `app/**/page.tsx` 只作为路由入口，页面实现放在 `src/page/<domain>` 下。

当前页面归属：

- `/` 探活页面归属 `system` 域。
- `/tailwind-design` 设计展示页面归属 `catalog` 域。

## TanStack Query 接入约定

Web 应用已接入 `@tanstack/react-query`，版本由根目录 `pnpm-workspace.yaml` 的 `catalog` 管理。`src/providers/Client-Provider.tsx` 提供 `QueryClientProvider`，并在 `app/layout.tsx` 中包裹页面树，让客户端组件可以使用 `useQuery` / `useMutation`。

职责边界：

- `packages/contracts`: 只放请求/响应 TypeScript 类型和 API route 需要的 schema。
- `apps/api/src/routes`: 负责输入输出的运行时校验。
- `src/api/http.ts`: 负责基础请求能力，例如 URL、headers、body 序列化和异常响应。
- `src/api/client-api`: 负责客户端 API 调用和 TanStack Query hook，不做 schema parse。
- `src/page`: 负责页面 UI、跨 API 编排和 query invalidation。

当前 system 示例保持“一个文件管理一个 API”：

- `src/api/client-api/system/clientPing.api.tsx`: `/ping` 请求函数和请求对象构造。
- `src/api/client-api/system/clientPingDemo.tsx`: `/ping` 对接 TanStack Query 的 `useMutation` hook。
- `src/api/client-api/system/clientHealth.api.tsx`: `/health` 请求函数和 `['system-health']` query key。
- `src/api/client-api/system/clientHealthDemo.tsx`: `/health` 对接 TanStack Query 的 `useQuery` hook。
- `src/page/system/system-query-demo.tsx`: 页面级组件，组合 health query 和 ping mutation；ping 成功后 invalidate `['system-health']`。

验证命令：

```sh
pnpm --filter web check-types
pnpm --filter web lint
pnpm run dev
```
