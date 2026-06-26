# Admin App

管理后台 Next.js 应用，默认运行在 `3001` 端口。

## 开发

```sh
pnpm --filter admin dev
```

打开 [http://localhost:3001](http://localhost:3001) 查看页面。

## 目录划分

Admin 应用统一使用 `src/api` 与 `src/page` 分层：

- `src/api` 只放接口调用逻辑，按 `system`、`catalog`、`user`、`order` 分域。
- 一个接口文件只管理一个后端 API 接口，例如 `src/api/system/health.ts` 只处理 `/health`。
- 每个域可以用自己的 `index.ts` 聚合域内接口，所有接口必须在 `src/api/index.ts` 聚合并统一导出。
- `src/page` 只放页面相关逻辑，也按 `system`、`catalog`、`user`、`order` 分域。
- 一个页面最多只调用一个后端接口，页面需要通过 `src/api/index.ts` 的统一导出获取接口能力。
- Next.js `app/**/page.tsx` 只作为路由入口，页面实现放在 `src/page/<domain>` 下。

当前首页归属 `system` 域，用于展示后台入口和 API `/health` 探活结果。
