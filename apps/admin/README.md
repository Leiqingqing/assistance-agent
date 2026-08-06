# Admin App

管理后台 Next.js 应用，默认运行在 `3001` 端口。

## 开发

```sh
pnpm --filter admin dev
```

打开 [http://localhost:3001](http://localhost:3001) 查看页面。

## 目录划分
 #### 划分原则
Admin 应用统一使用 `src/api` 与 `src/page` 分层：

- `src/api` 只放接口调用逻辑，按 `system`、`catalog`、`user`、`order` 分域。
- 一个接口文件只管理一个后端 API 接口，例如 `src/api/system/health.ts` 只处理 `/health`。
- 每个域可以用自己的 `index.ts` 聚合域内接口，所有接口必须在 `src/api/index.ts` 聚合并统一导出。
- 一个页面最多只调用一个后端接口，页面需要通过 `src/api/index.ts` 的统一导出获取接口能力。这个接口可以是按照页面数据封装好的。
- Next.js `app/**/page.tsx` 只作为路由入口，页面实现放在 `src/page/<domain>` 下。

当前首页归属 `system` 域，用于展示后台入口和 API `/health` 探活结果。

#### 目录结构

apps/admin/
├── app/                       # 路由与业务页面
│   ├── (auth)/login/          # 登录
│   ├── (dashboard)/           # 后台业务区
│   │   ├── users/             # 用户管理
│   │   ├── roles/             # 角色管理
│   │   ├── profile/           # 管理员资料
│   │   ├── default-avatar/    # 默认头像
│   │   ├── subscription-plans/
│   │   ├── subscriptions/
│   │   └── finance/
│   ├── layout.tsx             # 根布局
│   └── providers.tsx          # React Query Provider
├── src/
│   ├── auth/                  # 登录、Token、会话
│   ├── components/
│   │   └── layout/            # 侧栏、导航、后台布局
│   ├── lib/
│   │   ├── http.ts            # axios、Token 刷新、响应解包
│   │   └── ...                # URL、日期、UI 工具
│   └── env*.ts                # 环境变量校验
├── public/                    # 静态资源
├── next.config.js             # Next.js 静态导出配置
├── package.json
└── tsconfig.json