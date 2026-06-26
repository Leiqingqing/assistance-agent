```
npm install
npm run dev
```

```
open http://localhost:3000
```

## 目录划分

### API 服务

API 服务按域组织接口代码：

- 各个接口按域拆分到 `src/routes` 目录下，目前域包括 `system`、`catalog`、`user`、`order`。
- 每个域保留自己的 `index.ts`，并导出对应的 Hono routes。
- `src/routes/index.ts` 统一链接所有域 routes，默认导出聚合后的 `routes`，并导出 `RoutesType`。
- `src/app.ts` 只保留 app 层面的处理：
  - `new Hono`
  - `app.onError`、`app.notFound`
  - 挂载 `routes`
  - 导出 `AppType`

当前 system 域承载基础系统接口，包括 `/`、`/health`、`/ping`。

